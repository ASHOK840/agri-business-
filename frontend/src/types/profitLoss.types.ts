export interface SaleProfitLoss {
  saleId: string;
  saleNumber: string;
  crop: { id: string; cropCode: string; name: string; defaultBagWeightKg: number };
  buyer: { id: string; buyerCode: string; companyName: string };
  settlementStatus: 'ACCEPTED' | 'PRICE_ADJUSTED' | 'REJECTED';

  dispatchWeightKg: number;
  buyerFinalWeightKg: number;
  weightDifferenceKg: number;
  weightLossKg: number;

  sellingRatePerKg: number;
  effectiveSellingRatePerKg: number;
  revenue: number;
  settlementAdjustmentAmount: number;
  grossRevenue: number;

  costBasisAvailable: boolean;
  purchaseCostPerKg: number | null;
  purchaseCost: number | null;
  weightLossValue: number | null;

  transportCost: number;
  labourCost: number;
  otherExpenses: number;
  totalDirectExpenses: number;

  totalCost: number | null;
  grossProfit: number | null;
  netProfit: number | null;

  profitPerKg: number | null;
  profitPerBag: number | null;
  referenceMarginPer48kgBag: number | null;

  notes: string[];
}
