export interface CountAmount {
  count: number;
  totalAmount: number;
}

export interface DashboardInventoryItem {
  cropId: string;
  cropCode: string;
  cropName: string;
  currentStockKg: number;
  currentStockBags: number;
  lowStockThresholdKg: number | null;
  isLowStock: boolean;
}

export interface RecentPurchase {
  id: string;
  purchaseNumber: string;
  farmer: { id: string; farmerCode: string; name: string };
  crop: { id: string; name: string };
  totalGrossAmount: number;
  purchaseDate: string;
}

export interface RecentSale {
  id: string;
  saleNumber: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  crop: { id: string; name: string };
  expectedRevenue: number;
  status: string;
  saleDate: string;
}

export interface RecentPayment {
  id: string;
  paymentNumber: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  amount: number;
  paymentDate: string;
}

export interface RecentExpense {
  id: string;
  expenseNumber: string;
  category: { id: string; name: string };
  amount: number;
  expenseDate: string;
}

export interface PendingFarmerPaymentAlert {
  purchaseId: string;
  purchaseNumber: string;
  farmer: { id: string; farmerCode: string; name: string };
  remainingPayable: number;
  purchaseDate: string;
}

export interface PendingBuyerPaymentAlert {
  saleId: string;
  saleNumber: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  outstanding: number;
  saleDate: string;
}

export interface SettlementAlert {
  saleId: string;
  saleNumber: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  receivedDate: string;
}

export interface LargeWeightDifferenceAlert {
  saleId: string;
  saleNumber: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  weightDifferenceKg: number;
  differencePercentage: number;
}

export interface LowInventoryAlert {
  cropId: string;
  cropCode: string;
  cropName: string;
  currentStockKg: number;
  lowStockThresholdKg: number | null;
}

export interface PendingPurchaseCollectionAlert {
  purchaseId: string;
  purchaseNumber: string;
  status: string;
  farmer: { id: string; farmerCode: string; name: string };
  crop: { id: string; name: string };
  estimatedQuantityKg: number | null;
  purchaseDate: string;
}

export interface PendingTransportAlert {
  transportId: string;
  direction: string;
  status: string;
  transporter: { id: string; name: string };
  crop: { id: string; name: string };
  fromLocation: string;
  toLocation: string;
  transportDate: string;
}

export interface PendingSettlementAlert {
  saleId: string;
  saleNumber: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  status: string;
  dispatchWeightKg: number;
  saleDate: string;
}

export interface BusinessAlerts {
  generatedAt: string;
  totalCount: number;
  counts: Record<string, number>;
  farmerPaymentsPending: PendingFarmerPaymentAlert[];
  buyerPaymentsPending: PendingBuyerPaymentAlert[];
  salesRejected: SettlementAlert[];
  qualityPriceReductions: SettlementAlert[];
  significantWeightLoss: LargeWeightDifferenceAlert[];
  lowStock: LowInventoryAlert[];
  pendingPurchaseCollection: PendingPurchaseCollectionAlert[];
  pendingTransport: PendingTransportAlert[];
  pendingSettlement: PendingSettlementAlert[];
}

export interface Dashboard {
  generatedAt: string;
  today: {
    purchases: CountAmount;
    sales: CountAmount;
    expenses: CountAmount;
    payments: CountAmount;
  };
  current: {
    warehouseStockTotalKg: number;
    farmerOutstanding: number;
    buyerOutstanding: number;
  };
  profit: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  inventory: DashboardInventoryItem[];
  recent: {
    purchases: RecentPurchase[];
    sales: RecentSale[];
    payments: RecentPayment[];
    expenses: RecentExpense[];
  };
  alerts: BusinessAlerts;
}
