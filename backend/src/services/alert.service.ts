import prisma from '../config/prismaClient';
import { getCurrentStock } from './inventory.service';

const ALERT_LIMIT = 10;

// A weight difference at or beyond this magnitude is worth the owner's
// attention — ordinary moisture/handling loss in grain trade is
// typically well under this, so anything at or past it suggests a real
// issue (spoilage, miscount, scale error) rather than routine shrinkage.
const SIGNIFICANT_WEIGHT_LOSS_PERCENT = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Business Alerts — everything here is derived live from current
 * transactional state, never stored. Each category answers "what does
 * the owner need to act on right now?" Consumed by the owner dashboard
 * (Module 24) and available standalone at GET /api/alerts.
 */
export const getAlerts = async () => {
  const [
    outstandingPurchases,
    settledSales,
    settlementsWithLoss,
    inventory,
    pendingCollectionPurchases,
    pendingTransportRecords,
    salesAwaitingSettlement,
  ] = await Promise.all([
    // Farmer payment pending — money still owed to a farmer for crop
    // already bought (or in progress), regardless of collection stage.
    prisma.purchase.findMany({
      where: { status: { not: 'CANCELLED' }, remainingPayable: { gt: 0 } },
      select: {
        id: true,
        purchaseNumber: true,
        remainingPayable: true,
        purchaseDate: true,
        farmer: { select: { id: true, farmerCode: true, name: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    }),

    // Sales that have been settled — the base set both "buyer payment
    // pending", "sale rejected" and "quality price reduction" alerts
    // are drawn from.
    prisma.sale.findMany({
      where: { settlement: { isNot: null } },
      select: {
        id: true,
        saleNumber: true,
        saleDate: true,
        buyer: { select: { id: true, buyerCode: true, companyName: true } },
        settlement: { select: { finalSettlementAmount: true, receivedDate: true, settlementStatus: true } },
        payments: { select: { amount: true } },
      },
    }),

    // Significant weight loss — the buyer received meaningfully LESS
    // than what was dispatched. A positive difference (buyer's scale
    // reads heavier) is not a loss and is deliberately excluded here.
    prisma.saleSettlement.findMany({
      where: { differencePercentage: { lte: -SIGNIFICANT_WEIGHT_LOSS_PERCENT } },
      include: { sale: { select: { id: true, saleNumber: true, buyer: { select: { id: true, buyerCode: true, companyName: true } } } } },
      orderBy: { receivedDate: 'desc' },
      take: ALERT_LIMIT,
    }),

    getCurrentStock({}),

    // Pending purchase collection — a deal has been struck (or is
    // still being negotiated) but the crop has not yet been physically
    // collected from the farmer.
    prisma.purchase.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      select: {
        id: true,
        purchaseNumber: true,
        status: true,
        purchaseDate: true,
        estimatedQuantityKg: true,
        farmer: { select: { id: true, farmerCode: true, name: true } },
        crop: { select: { id: true, name: true } },
      },
      orderBy: { purchaseDate: 'asc' },
      take: ALERT_LIMIT,
    }),

    // Pending transport — a leg (farmer→warehouse or warehouse→buyer)
    // that has been booked but not yet delivered.
    prisma.transportRecord.findMany({
      where: { status: { in: ['PENDING', 'IN_TRANSIT'] } },
      select: {
        id: true,
        direction: true,
        status: true,
        fromLocation: true,
        toLocation: true,
        transportDate: true,
        transporter: { select: { id: true, name: true } },
        crop: { select: { id: true, name: true } },
      },
      orderBy: { transportDate: 'asc' },
      take: ALERT_LIMIT,
    }),

    // Pending settlement — the truck has left the warehouse (or been
    // marked delivered) but the buyer's final weight/settlement has
    // not been recorded yet.
    prisma.sale.findMany({
      where: { status: { in: ['DISPATCHED', 'DELIVERED'] }, settlement: { is: null } },
      select: {
        id: true,
        saleNumber: true,
        saleDate: true,
        dispatchWeightKg: true,
        status: true,
        buyer: { select: { id: true, buyerCode: true, companyName: true } },
      },
      orderBy: { saleDate: 'asc' },
      take: ALERT_LIMIT,
    }),
  ]);

  const salesWithOutstanding = settledSales
    .map((s) => {
      const finalAmount = Number(s.settlement!.finalSettlementAmount);
      const paid = round2(s.payments.reduce((sum, p) => sum + Number(p.amount), 0));
      const outstanding = round2(finalAmount - paid);
      return { ...s, outstanding };
    })
    .filter((s) => s.outstanding > 0);

  const farmerPaymentsPending = outstandingPurchases.slice(0, ALERT_LIMIT).map((p) => ({
    purchaseId: p.id,
    purchaseNumber: p.purchaseNumber,
    farmer: p.farmer,
    remainingPayable: Number(p.remainingPayable),
    purchaseDate: p.purchaseDate,
  }));

  const buyerPaymentsPending = salesWithOutstanding
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, ALERT_LIMIT)
    .map((s) => ({
      saleId: s.id,
      saleNumber: s.saleNumber,
      buyer: s.buyer,
      outstanding: s.outstanding,
      saleDate: s.saleDate,
    }));

  const salesRejected = settledSales
    .filter((s) => s.settlement!.settlementStatus === 'REJECTED')
    .sort((a, b) => b.settlement!.receivedDate.getTime() - a.settlement!.receivedDate.getTime())
    .slice(0, ALERT_LIMIT)
    .map((s) => ({
      saleId: s.id,
      saleNumber: s.saleNumber,
      buyer: s.buyer,
      receivedDate: s.settlement!.receivedDate,
    }));

  const qualityPriceReductions = settledSales
    .filter((s) => s.settlement!.settlementStatus === 'PRICE_ADJUSTED')
    .sort((a, b) => b.settlement!.receivedDate.getTime() - a.settlement!.receivedDate.getTime())
    .slice(0, ALERT_LIMIT)
    .map((s) => ({
      saleId: s.id,
      saleNumber: s.saleNumber,
      buyer: s.buyer,
      receivedDate: s.settlement!.receivedDate,
    }));

  const significantWeightLoss = settlementsWithLoss.map((s) => ({
    saleId: s.sale.id,
    saleNumber: s.sale.saleNumber,
    buyer: s.sale.buyer,
    weightDifferenceKg: Number(s.weightDifferenceKg),
    differencePercentage: Number(s.differencePercentage),
  }));

  const lowStock = inventory
    .filter((c) => c.isLowStock)
    .map((c) => ({
      cropId: c.cropId,
      cropCode: c.cropCode,
      cropName: c.cropName,
      currentStockKg: c.currentStockKg,
      lowStockThresholdKg: c.lowStockThresholdKg,
    }));

  const pendingPurchaseCollection = pendingCollectionPurchases.map((p) => ({
    purchaseId: p.id,
    purchaseNumber: p.purchaseNumber,
    status: p.status,
    farmer: p.farmer,
    crop: p.crop,
    estimatedQuantityKg: p.estimatedQuantityKg ? Number(p.estimatedQuantityKg) : null,
    purchaseDate: p.purchaseDate,
  }));

  const pendingTransport = pendingTransportRecords.map((t) => ({
    transportId: t.id,
    direction: t.direction,
    status: t.status,
    transporter: t.transporter,
    crop: t.crop,
    fromLocation: t.fromLocation,
    toLocation: t.toLocation,
    transportDate: t.transportDate,
  }));

  const pendingSettlement = salesAwaitingSettlement.map((s) => ({
    saleId: s.id,
    saleNumber: s.saleNumber,
    buyer: s.buyer,
    status: s.status,
    dispatchWeightKg: Number(s.dispatchWeightKg),
    saleDate: s.saleDate,
  }));

  const counts = {
    farmerPaymentsPending: farmerPaymentsPending.length,
    buyerPaymentsPending: buyerPaymentsPending.length,
    salesRejected: salesRejected.length,
    qualityPriceReductions: qualityPriceReductions.length,
    significantWeightLoss: significantWeightLoss.length,
    lowStock: lowStock.length,
    pendingPurchaseCollection: pendingPurchaseCollection.length,
    pendingTransport: pendingTransport.length,
    pendingSettlement: pendingSettlement.length,
  };

  const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return {
    generatedAt: new Date(),
    totalCount,
    counts,
    farmerPaymentsPending,
    buyerPaymentsPending,
    salesRejected,
    qualityPriceReductions,
    significantWeightLoss,
    lowStock,
    pendingPurchaseCollection,
    pendingTransport,
    pendingSettlement,
  };
};
