import prisma from '../config/prismaClient';
import { getBusinessProfile } from './businessProfile.service';

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found.');
    this.name = 'PurchaseNotFoundError';
  }
}

export class SaleNotFoundError extends Error {
  constructor() {
    super('Sale not found.');
    this.name = 'SaleNotFoundError';
  }
}

export class BuyerPaymentNotFoundError extends Error {
  constructor() {
    super('Buyer payment not found.');
    this.name = 'BuyerPaymentNotFoundError';
  }
}

const DOCUMENT_PREFIXES: Record<
  'FARMER_PURCHASE_RECEIPT' | 'FARMER_PAYMENT_RECEIPT' | 'BUYER_SALES_INVOICE' | 'BUYER_PAYMENT_RECEIPT',
  string
> = {
  FARMER_PURCHASE_RECEIPT: 'FPR',
  FARMER_PAYMENT_RECEIPT: 'FPY',
  BUYER_SALES_INVOICE: 'INV',
  BUYER_PAYMENT_RECEIPT: 'BPR',
};

type DocumentType = keyof typeof DOCUMENT_PREFIXES;

const round2 = (n: number) => Math.round(n * 100) / 100;

const generateNextDocumentNumber = async (documentType: DocumentType): Promise<string> => {
  const prefix = DOCUMENT_PREFIXES[documentType];
  const year = new Date().getFullYear();
  const numberPrefix = `${prefix}-${year}-`;

  const last = await prisma.generatedDocument.findFirst({
    where: { documentType, documentNumber: { startsWith: numberPrefix } },
    orderBy: { documentNumber: 'desc' },
  });

  let nextNumber = 1;
  if (last) {
    const match = last.documentNumber.match(/-(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `${numberPrefix}${String(nextNumber).padStart(4, '0')}`;
};

// A document number is issued ONCE per (documentType, source record) and
// reused on every subsequent view/reprint — never regenerated. This is
// the only thing persisted for a document; all its actual figures are
// assembled fresh from live data below, every time.
const getOrCreateDocumentNumber = async (
  documentType: DocumentType,
  sourceField: 'purchaseId' | 'saleId' | 'buyerPaymentId',
  sourceId: string,
  generatedBy: string
): Promise<{ documentNumber: string; generatedAt: Date }> => {
  const existing = await prisma.generatedDocument.findFirst({
    where: { documentType, [sourceField]: sourceId },
  });
  if (existing) return { documentNumber: existing.documentNumber, generatedAt: existing.createdAt };

  const documentNumber = await generateNextDocumentNumber(documentType);
  try {
    const created = await prisma.generatedDocument.create({
      data: {
        documentNumber,
        documentType,
        [sourceField]: sourceId,
        generatedBy,
      },
    });
    return { documentNumber: created.documentNumber, generatedAt: created.createdAt };
  } catch {
    // Extremely rare race: two requests both found no existing row and
    // both tried to create one. Whoever lost re-reads the winner's row
    // rather than erroring, keeping this genuinely idempotent.
    const raceWinner = await prisma.generatedDocument.findFirst({
      where: { documentType, [sourceField]: sourceId },
    });
    if (raceWinner) return { documentNumber: raceWinner.documentNumber, generatedAt: raceWinner.createdAt };
    throw new Error('Could not assign a document number.');
  }
};

const getBusinessInfo = async () => {
  const profile = await getBusinessProfile();
  return {
    businessName: profile?.businessName ?? null,
    ownerName: profile?.ownerName ?? null,
    address: profile?.address ?? null,
    phone: profile?.phone ?? null,
    pan: profile?.pan ?? null,
    gstin: profile?.gstin ?? null,
  };
};

// --- 1. Farmer Purchase Receipt -------------------------------------------
export const getFarmerPurchaseReceipt = async (purchaseId: string, generatedBy: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      farmer: { select: { id: true, farmerCode: true, name: true, phone: true, village: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
    },
  });
  if (!purchase) throw new PurchaseNotFoundError();

  const { documentNumber, generatedAt } = await getOrCreateDocumentNumber(
    'FARMER_PURCHASE_RECEIPT',
    'purchaseId',
    purchaseId,
    generatedBy
  );

  const advance = Number(purchase.advanceAmount);

  return {
    documentType: 'FARMER_PURCHASE_RECEIPT' as const,
    documentNumber,
    generatedAt,
    business: await getBusinessInfo(),

    date: purchase.purchaseDate,
    farmer: purchase.farmer,
    crop: purchase.crop,
    numberOfBags: purchase.numberOfBags,
    weightKg: purchase.actualQuantityKg ?? purchase.estimatedQuantityKg,
    purchaseRatePerKg: Number(purchase.purchaseRatePerKg),
    grossAmount: Number(purchase.totalGrossAmount),
    advance,
    paid: advance,
    balance: Number(purchase.remainingPayable),
  };
};

// --- 2. Farmer Payment Receipt ---------------------------------------------
// Keyed off the same Purchase — there is no separate farmer payment
// ledger (unlike buyers, see BuyerPayment/Module 19), so this reflects
// the purchase's current advance/balance rather than one immutable
// payment event. See the schema.prisma comment on GeneratedDocument.
export const getFarmerPaymentReceipt = async (purchaseId: string, generatedBy: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      farmer: { select: { id: true, farmerCode: true, name: true, phone: true, village: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
    },
  });
  if (!purchase) throw new PurchaseNotFoundError();

  const { documentNumber, generatedAt } = await getOrCreateDocumentNumber(
    'FARMER_PAYMENT_RECEIPT',
    'purchaseId',
    purchaseId,
    generatedBy
  );

  const advance = Number(purchase.advanceAmount);

  return {
    documentType: 'FARMER_PAYMENT_RECEIPT' as const,
    documentNumber,
    generatedAt,
    business: await getBusinessInfo(),

    date: purchase.purchaseDate,
    farmer: purchase.farmer,
    crop: purchase.crop,
    numberOfBags: purchase.numberOfBags,
    weightKg: purchase.actualQuantityKg ?? purchase.estimatedQuantityKg,
    purchaseRatePerKg: Number(purchase.purchaseRatePerKg),
    grossAmount: Number(purchase.totalGrossAmount),
    advance,
    paid: advance,
    balance: Number(purchase.remainingPayable),
  };
};

// --- 3. Buyer Sales Invoice / Dispatch Document -----------------------------
export const getBuyerSalesInvoice = async (saleId: string, generatedBy: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      buyer: { select: { id: true, buyerCode: true, companyName: true, contactPerson: true, phone: true, address: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
      settlement: true,
    },
  });
  if (!sale) throw new SaleNotFoundError();

  const { documentNumber, generatedAt } = await getOrCreateDocumentNumber(
    'BUYER_SALES_INVOICE',
    'saleId',
    saleId,
    generatedBy
  );

  const dispatchWeightKg = Number(sale.dispatchWeightKg);
  const sellingRatePerKg = Number(sale.sellingRatePerKg);
  const expectedAmount = Number(sale.expectedRevenue);

  const settlement = sale.settlement;

  return {
    documentType: 'BUYER_SALES_INVOICE' as const,
    documentNumber,
    generatedAt,
    business: await getBusinessInfo(),

    date: sale.saleDate,
    buyer: sale.buyer,
    crop: sale.crop,
    numberOfBags: sale.numberOfBags,
    dispatchWeightKg,
    sellingRatePerKg,
    expectedAmount,

    finalBuyerWeightKg: settlement ? Number(settlement.buyerFinalWeightKg) : null,
    settlementAdjustment: settlement ? Number(settlement.adjustmentAmount) : null,
    finalAmount: settlement ? Number(settlement.finalSettlementAmount) : null,
  };
};

// --- 4. Buyer Payment Receipt -----------------------------------------------
export const getBuyerPaymentReceipt = async (buyerPaymentId: string, generatedBy: string) => {
  const payment = await prisma.buyerPayment.findUnique({
    where: { id: buyerPaymentId },
    include: {
      buyer: { select: { id: true, buyerCode: true, companyName: true, contactPerson: true, phone: true } },
      sale: {
        select: {
          id: true,
          saleNumber: true,
          crop: { select: { id: true, cropCode: true, name: true } },
          settlement: { select: { finalSettlementAmount: true } },
          payments: { select: { amount: true } },
        },
      },
    },
  });
  if (!payment) throw new BuyerPaymentNotFoundError();

  const { documentNumber, generatedAt } = await getOrCreateDocumentNumber(
    'BUYER_PAYMENT_RECEIPT',
    'buyerPaymentId',
    buyerPaymentId,
    generatedBy
  );

  const finalSaleAmount = payment.sale.settlement
    ? Number(payment.sale.settlement.finalSettlementAmount)
    : null;
  const totalPaid = round2(payment.sale.payments.reduce((sum, p) => sum + Number(p.amount), 0));
  const outstandingAfterThisPayment =
    finalSaleAmount !== null ? round2(finalSaleAmount - totalPaid) : null;

  return {
    documentType: 'BUYER_PAYMENT_RECEIPT' as const,
    documentNumber,
    generatedAt,
    business: await getBusinessInfo(),

    date: payment.paymentDate,
    buyer: payment.buyer,
    sale: { id: payment.sale.id, saleNumber: payment.sale.saleNumber, crop: payment.sale.crop },
    paymentNumber: payment.paymentNumber,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    transactionReferenceNumber: payment.transactionReferenceNumber,

    finalSaleAmount,
    totalPaidToDate: totalPaid,
    outstandingBalance: outstandingAfterThisPayment,
  };
};
