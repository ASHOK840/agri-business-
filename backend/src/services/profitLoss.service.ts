import prisma from '../config/prismaClient';

export class SaleNotFoundError extends Error {
  constructor() {
    super('Sale not found.');
    this.name = 'SaleNotFoundError';
  }
}

export class SettlementRequiredError extends Error {
  constructor() {
    super(
      "Profit/loss can only be calculated for a completed sale — this sale's delivery settlement has not been recorded yet."
    );
    this.name = 'SettlementRequiredError';
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// The crop's acquisition cost is NEVER a fixed value — it's the weighted
// average of every farmer purchase that actually contributed stock to
// this crop, up to (and including) the day of this sale. Inventory is
// fungible once in the warehouse (no batch/lot tracking), so this is the
// only honest way to cost a specific sale's dispatched quantity against
// real purchase transactions rather than guessing which farmer's grain
// physically left in this particular truck.
const getWeightedAverageCostPerKg = async (cropId: string, asOfDate: Date) => {
  const inTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      cropId,
      movementType: 'IN',
      referenceType: 'PURCHASE',
      movementDate: { lte: asOfDate },
    },
    include: { purchase: { select: { purchaseRatePerKg: true } } },
  });

  let totalKg = 0;
  let totalCost = 0;
  for (const txn of inTransactions) {
    if (!txn.purchase) continue;
    const qty = Number(txn.quantityKg);
    totalKg += qty;
    totalCost += qty * Number(txn.purchase.purchaseRatePerKg);
  }

  if (totalKg <= 0) return null; // no traceable purchase cost basis
  return totalCost / totalKg;
};

// The financial calculation this whole module exists for. Every figure
// is derived from real rows (Sale, SaleSettlement, InventoryTransaction
// joined to Purchase, Expense) at request time — nothing here is a
// stored or fixed profit number, so it always reflects the current data.
export const getSaleProfitLoss = async (saleId: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      crop: { select: { id: true, cropCode: true, name: true, defaultBagWeightKg: true } },
      buyer: { select: { id: true, buyerCode: true, companyName: true } },
      settlement: true,
    },
  });
  if (!sale) throw new SaleNotFoundError();
  if (!sale.settlement) throw new SettlementRequiredError();

  const settlement = sale.settlement;
  const notes: string[] = [];

  // --- Weight & the settlement basis for revenue ---------------------
  const dispatchWeightKg = Number(settlement.dispatchWeightKg);
  const buyerFinalWeightKg = Number(settlement.buyerFinalWeightKg);
  const weightDifferenceKg = round2(buyerFinalWeightKg - dispatchWeightKg);
  // Positive magnitude of what was physically lost (0 if final >= dispatch).
  const weightLossKg = weightDifferenceKg < 0 ? round2(-weightDifferenceKg) : 0;

  // --- Revenue: buyer-final quantity × actual settlement rate ---------
  // "Selling revenue should use the actual buyer-final quantity when
  // that is the settlement basis" — never the original dispatch weight,
  // and never the original rate when a price adjustment was recorded.
  const sellingRatePerKg = Number(settlement.sellingRatePerKg);
  const effectiveSellingRatePerKg =
    settlement.settlementStatus === 'PRICE_ADJUSTED' && settlement.adjustedSellingRatePerKg !== null
      ? Number(settlement.adjustedSellingRatePerKg)
      : sellingRatePerKg;

  const revenue = round2(buyerFinalWeightKg * effectiveSellingRatePerKg);
  const settlementAdjustmentAmount = round2(Number(settlement.adjustmentAmount));
  const grossRevenue = round2(revenue + settlementAdjustmentAmount);

  if (settlement.settlementStatus === 'REJECTED') {
    notes.push(
      'This delivery was rejected by the buyer — revenue reflects only what was actually accepted and paid for, if anything.'
    );
  }

  // --- Crop purchase cost: weighted-average COGS on the FULL dispatched
  // quantity (what actually left the warehouse and was paid for), not
  // the buyer-final quantity — the gap between the two IS the weight
  // loss, and its cost must show up as a real loss below, not vanish.
  //
  // Exception: if the buyer rejected goods and they were RETURNED to the
  // warehouse (Module 18's automatic stock reversal), that quantity was
  // never actually consumed — it's back in stock, available to resell.
  // Charging its full purchase cost against this failed attempt would
  // overstate the loss; only the returned portion is excluded here, so
  // this sale's real loss is limited to whatever was genuinely spent
  // (transport/labour already sunk) rather than the crop's value itself.
  const returnedToWarehouseKg =
    settlement.settlementStatus === 'REJECTED' &&
    settlement.rejectionAction === 'RETURN_TO_WAREHOUSE' &&
    settlement.quantityAffectedKg !== null
      ? Number(settlement.quantityAffectedKg)
      : 0;
  const costBasisWeightKg = Math.max(0, dispatchWeightKg - returnedToWarehouseKg);

  const purchaseCostPerKg = await getWeightedAverageCostPerKg(sale.cropId, sale.saleDate);
  const costBasisAvailable = purchaseCostPerKg !== null;
  const purchaseCost = costBasisAvailable
    ? round2(costBasisWeightKg * (purchaseCostPerKg as number))
    : null;
  const weightLossValue = costBasisAvailable
    ? round2(weightLossKg * (purchaseCostPerKg as number))
    : null;

  if (!costBasisAvailable) {
    notes.push(
      'No traceable farmer-purchase cost history was found for this crop as of the sale date — purchase cost and profit figures cannot be determined.'
    );
  }
  if (returnedToWarehouseKg > 0) {
    notes.push(
      `${returnedToWarehouseKg}kg of the rejected quantity was returned to the warehouse and is excluded from this sale's purchase cost — it remains in stock for resale, not a real loss on this transaction.`
    );
  }

  // --- Transport/Labour/Other: only expenses explicitly linked to THIS
  // sale (see Module 21's Expense.saleId). Inbound farmer→warehouse
  // transport/labour tied to the original purchases is NOT apportioned
  // here — that would require inventing an allocation method the app
  // has no real basis for, so it's called out below instead of guessed.
  const linkedExpenses = await prisma.expense.findMany({
    where: { saleId, status: 'ACTIVE' },
    include: { category: { select: { code: true } } },
  });

  let transportCost = 0;
  let labourCost = 0;
  let otherExpenses = 0;
  for (const expense of linkedExpenses) {
    const amount = Number(expense.amount);
    if (expense.category.code === 'TRANSPORTATION') transportCost += amount;
    else if (expense.category.code === 'LABOUR') labourCost += amount;
    else otherExpenses += amount;
  }
  transportCost = round2(transportCost);
  labourCost = round2(labourCost);
  otherExpenses = round2(otherExpenses);
  const totalDirectExpenses = round2(transportCost + labourCost + otherExpenses);

  if (linkedExpenses.length === 0) {
    notes.push(
      'No expenses are linked to this sale yet — transport, labour, and other costs shown here will be incomplete until relevant expenses are recorded against it.'
    );
  }
  notes.push(
    'Inbound farmer-to-warehouse transport and labour costs (tracked per purchase) are not apportioned into this per-sale figure — only expenses linked directly to this sale are included.'
  );

  // --- Totals -----------------------------------------------------------
  const totalCost = costBasisAvailable ? round2((purchaseCost as number) + totalDirectExpenses) : null;
  const grossProfit = costBasisAvailable ? round2(grossRevenue - (purchaseCost as number)) : null;
  const netProfit = costBasisAvailable ? round2((grossProfit as number) - totalDirectExpenses) : null;

  // --- Per-unit figures — always on the PHYSICAL dispatched quantity,
  // never the buyer-final weight, so weight loss is reflected per unit
  // handled rather than diluted away.
  const bagWeightKg = Number(sale.crop.defaultBagWeightKg);
  const dispatchBags = dispatchWeightKg / bagWeightKg;
  const profitPerKg = netProfit !== null ? round2(netProfit / dispatchWeightKg) : null;
  const profitPerBag = netProfit !== null && dispatchBags > 0 ? round2(netProfit / dispatchBags) : null;

  // --- Internal reference-only margin on a fixed 48kg trade unit. This
  // is NOT accounting profit — it's a separate, traditional reference
  // some buyers/owners use, kept clearly labeled and separate.
  const referenceBags48kg = dispatchWeightKg / 48;
  const referenceMarginPer48kgBag =
    netProfit !== null && referenceBags48kg > 0 ? round2(netProfit / referenceBags48kg) : null;

  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    crop: {
      id: sale.crop.id,
      cropCode: sale.crop.cropCode,
      name: sale.crop.name,
      defaultBagWeightKg: bagWeightKg,
    },
    buyer: sale.buyer,
    settlementStatus: settlement.settlementStatus,

    dispatchWeightKg,
    buyerFinalWeightKg,
    weightDifferenceKg,
    weightLossKg,

    sellingRatePerKg,
    effectiveSellingRatePerKg,
    revenue,
    settlementAdjustmentAmount,
    grossRevenue,

    costBasisAvailable,
    purchaseCostPerKg: costBasisAvailable ? round2(purchaseCostPerKg as number) : null,
    purchaseCost,
    weightLossValue,

    transportCost,
    labourCost,
    otherExpenses,
    totalDirectExpenses,

    totalCost,
    grossProfit,
    netProfit,

    profitPerKg,
    profitPerBag,
    referenceMarginPer48kgBag,

    notes,
  };
};
