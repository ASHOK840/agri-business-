export interface BusinessDocumentInfo {
  businessName: string | null;
  ownerName: string | null;
  address: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
}

export interface FarmerReceiptDocument {
  documentType: 'FARMER_PURCHASE_RECEIPT' | 'FARMER_PAYMENT_RECEIPT';
  documentNumber: string;
  generatedAt: string;
  business: BusinessDocumentInfo;

  date: string;
  farmer: { id: string; farmerCode: string; name: string; phone: string | null; village: string | null };
  crop: { id: string; cropCode: string; name: string };
  numberOfBags: number | null;
  weightKg: string | null;
  purchaseRatePerKg: number;
  grossAmount: number;
  advance: number;
  paid: number;
  balance: number;
}

export interface BuyerSalesInvoiceDocument {
  documentType: 'BUYER_SALES_INVOICE';
  documentNumber: string;
  generatedAt: string;
  business: BusinessDocumentInfo;

  date: string;
  buyer: {
    id: string;
    buyerCode: string;
    companyName: string;
    contactPerson: string | null;
    phone: string | null;
    address: string | null;
  };
  crop: { id: string; cropCode: string; name: string };
  numberOfBags: number | null;
  dispatchWeightKg: number;
  sellingRatePerKg: number;
  expectedAmount: number;

  finalBuyerWeightKg: number | null;
  settlementAdjustment: number | null;
  finalAmount: number | null;
}

export interface BuyerPaymentReceiptDocument {
  documentType: 'BUYER_PAYMENT_RECEIPT';
  documentNumber: string;
  generatedAt: string;
  business: BusinessDocumentInfo;

  date: string;
  buyer: { id: string; buyerCode: string; companyName: string; contactPerson: string | null; phone: string | null };
  sale: { id: string; saleNumber: string; crop: { id: string; cropCode: string; name: string } };
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  transactionReferenceNumber: string | null;

  finalSaleAmount: number | null;
  totalPaidToDate: number;
  outstandingBalance: number | null;
}
