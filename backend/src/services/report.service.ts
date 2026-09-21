import prisma from '../config/prismaClient';
import { getSaleProfitLoss } from './profitLoss.service';
import { ReportQuery } from '../validators/report.validator';
import { ReportColumn } from '../utils/csv.util';

export interface ReportResult {
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  summary?: Record<string, string | number | null>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const dateStr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

// Shared date-range fragment for whichever date field a given report
// filters on — every report uses this so "date range" behaves
// identically everywhere.
const dateRange = (filters: ReportQuery) => {
  if (!filters.dateFrom && !filters.dateTo) return undefined;
  return {
    ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
    ...(filters.dateTo ? { lte: filters.dateTo } : {}),
  };
};

// ---------------------------------------------------------------------
// 1. Farmer report — aggregated per farmer from their purchases.
// ---------------------------------------------------------------------
const getFarmerReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const purchases = await prisma.purchase.findMany({
    where: {
      ...(filters.farmerId ? { farmerId: filters.farmerId } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { purchaseDate: dateRange(filters) } : {}),
    },
    include: { farmer: true },
  });

  const byFarmer = new Map<
    string,
    { farmer: (typeof purchases)[number]['farmer']; count: number; quantityKg: number; grossAmount: number; advance: number; outstanding: number }
  >();
  for (const p of purchases) {
    const entry = byFarmer.get(p.farmerId) ?? {
      farmer: p.farmer,
      count: 0,
      quantityKg: 0,
      grossAmount: 0,
      advance: 0,
      outstanding: 0,
    };
    entry.count += 1;
    entry.quantityKg += Number(p.actualQuantityKg ?? p.estimatedQuantityKg ?? 0);
    entry.grossAmount += Number(p.totalGrossAmount);
    entry.advance += Number(p.advanceAmount);
    entry.outstanding += Number(p.remainingPayable);
    byFarmer.set(p.farmerId, entry);
  }

  const rows = Array.from(byFarmer.values()).map((e) => ({
    farmerCode: e.farmer.farmerCode,
    name: e.farmer.name,
    village: e.farmer.village,
    purchases: e.count,
    quantityKg: round2(e.quantityKg),
    grossAmount: round2(e.grossAmount),
    advance: round2(e.advance),
    outstanding: round2(e.outstanding),
  }));

  return {
    columns: [
      { key: 'farmerCode', label: 'Farmer Code' },
      { key: 'name', label: 'Farmer Name' },
      { key: 'village', label: 'Village' },
      { key: 'purchases', label: 'Purchases' },
      { key: 'quantityKg', label: 'Quantity (kg)' },
      { key: 'grossAmount', label: 'Gross Amount' },
      { key: 'advance', label: 'Advance Paid' },
      { key: 'outstanding', label: 'Outstanding' },
    ],
    rows,
    summary: {
      totalFarmers: rows.length,
      totalGrossAmount: round2(rows.reduce((s, r) => s + r.grossAmount, 0)),
      totalOutstanding: round2(rows.reduce((s, r) => s + r.outstanding, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 2. Crop purchase report — one row per purchase transaction.
// ---------------------------------------------------------------------
const getCropPurchaseReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const purchases = await prisma.purchase.findMany({
    where: {
      ...(filters.farmerId ? { farmerId: filters.farmerId } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { purchaseDate: dateRange(filters) } : {}),
    },
    include: { farmer: true, crop: true },
    orderBy: { purchaseDate: 'desc' },
  });

  const rows = purchases.map((p) => ({
    purchaseNumber: p.purchaseNumber,
    date: dateStr(p.purchaseDate),
    farmer: p.farmer.name,
    crop: p.crop.name,
    quality: p.quality,
    bags: p.numberOfBags,
    quantityKg: p.actualQuantityKg ? Number(p.actualQuantityKg) : p.estimatedQuantityKg ? Number(p.estimatedQuantityKg) : null,
    ratePerKg: Number(p.purchaseRatePerKg),
    grossAmount: Number(p.totalGrossAmount),
    advance: Number(p.advanceAmount),
    balance: Number(p.remainingPayable),
    status: p.status,
  }));

  return {
    columns: [
      { key: 'purchaseNumber', label: 'Purchase #' },
      { key: 'date', label: 'Date' },
      { key: 'farmer', label: 'Farmer' },
      { key: 'crop', label: 'Crop' },
      { key: 'quality', label: 'Quality' },
      { key: 'bags', label: 'Bags' },
      { key: 'quantityKg', label: 'Quantity (kg)' },
      { key: 'ratePerKg', label: 'Rate/kg' },
      { key: 'grossAmount', label: 'Gross Amount' },
      { key: 'advance', label: 'Advance' },
      { key: 'balance', label: 'Balance' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summary: {
      totalPurchases: rows.length,
      totalQuantityKg: round2(rows.reduce((s, r) => s + (r.quantityKg ?? 0), 0)),
      totalGrossAmount: round2(rows.reduce((s, r) => s + r.grossAmount, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 3. Crop sales report — one row per sale transaction.
// ---------------------------------------------------------------------
const getCropSalesReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const sales = await prisma.sale.findMany({
    where: {
      ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { saleDate: dateRange(filters) } : {}),
    },
    include: { buyer: true, crop: true },
    orderBy: { saleDate: 'desc' },
  });

  const rows = sales.map((s) => ({
    saleNumber: s.saleNumber,
    date: dateStr(s.saleDate),
    buyer: s.buyer.companyName,
    crop: s.crop.name,
    bags: s.numberOfBags,
    dispatchWeightKg: Number(s.dispatchWeightKg),
    ratePerKg: Number(s.sellingRatePerKg),
    expectedRevenue: Number(s.expectedRevenue),
    status: s.status,
  }));

  return {
    columns: [
      { key: 'saleNumber', label: 'Sale #' },
      { key: 'date', label: 'Date' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'crop', label: 'Crop' },
      { key: 'bags', label: 'Bags' },
      { key: 'dispatchWeightKg', label: 'Dispatch Weight (kg)' },
      { key: 'ratePerKg', label: 'Rate/kg' },
      { key: 'expectedRevenue', label: 'Expected Revenue' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summary: {
      totalSales: rows.length,
      totalDispatchWeightKg: round2(rows.reduce((s, r) => s + r.dispatchWeightKg, 0)),
      totalExpectedRevenue: round2(rows.reduce((s, r) => s + r.expectedRevenue, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 4. Inventory report — opening/in/out/adjustment/closing per crop.
// ---------------------------------------------------------------------
const getInventoryReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const crops = await prisma.crop.findMany({
    where: filters.cropId ? { id: filters.cropId } : { status: 'ACTIVE' },
  });

  const movements = await prisma.inventoryTransaction.findMany({
    where: filters.cropId ? { cropId: filters.cropId } : {},
  });

  const netOf = (list: typeof movements) =>
    list.reduce((sum, m) => {
      const qty = Number(m.quantityKg);
      if (m.movementType === 'IN') return sum + qty;
      if (m.movementType === 'OUT') return sum - qty;
      return sum + qty;
    }, 0);

  const rows = crops.map((crop) => {
    const cropMovements = movements.filter((m) => m.cropId === crop.id);
    const beforePeriod = filters.dateFrom
      ? cropMovements.filter((m) => m.movementDate < filters.dateFrom!)
      : [];
    const inPeriod = cropMovements.filter(
      (m) =>
        (!filters.dateFrom || m.movementDate >= filters.dateFrom) &&
        (!filters.dateTo || m.movementDate <= filters.dateTo!)
    );

    const opening = filters.dateFrom ? round2(netOf(beforePeriod)) : 0;
    const inKg = round2(inPeriod.filter((m) => m.movementType === 'IN').reduce((s, m) => s + Number(m.quantityKg), 0));
    const outKg = round2(inPeriod.filter((m) => m.movementType === 'OUT').reduce((s, m) => s + Number(m.quantityKg), 0));
    const adjKg = round2(inPeriod.filter((m) => m.movementType === 'ADJUSTMENT').reduce((s, m) => s + Number(m.quantityKg), 0));
    const closing = round2(opening + inKg - outKg + adjKg);

    return {
      cropCode: crop.cropCode,
      crop: crop.name,
      openingStockKg: opening,
      inKg,
      outKg,
      adjustmentKg: adjKg,
      closingStockKg: closing,
    };
  });

  return {
    columns: [
      { key: 'cropCode', label: 'Crop Code' },
      { key: 'crop', label: 'Crop' },
      { key: 'openingStockKg', label: 'Opening Stock (kg)' },
      { key: 'inKg', label: 'In (kg)' },
      { key: 'outKg', label: 'Out (kg)' },
      { key: 'adjustmentKg', label: 'Adjustment (kg)' },
      { key: 'closingStockKg', label: 'Closing Stock (kg)' },
    ],
    rows,
    summary: {
      totalClosingStockKg: round2(rows.reduce((s, r) => s + r.closingStockKg, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 5. Buyer report — aggregated per buyer from their sales.
// ---------------------------------------------------------------------
const getBuyerReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const sales = await prisma.sale.findMany({
    where: {
      ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { saleDate: dateRange(filters) } : {}),
    },
    include: { buyer: true, settlement: true, payments: true },
  });

  const byBuyer = new Map<
    string,
    {
      buyer: (typeof sales)[number]['buyer'];
      count: number;
      dispatchWeightKg: number;
      expectedRevenue: number;
      finalAmount: number;
      paid: number;
    }
  >();
  for (const s of sales) {
    const entry = byBuyer.get(s.buyerId) ?? {
      buyer: s.buyer,
      count: 0,
      dispatchWeightKg: 0,
      expectedRevenue: 0,
      finalAmount: 0,
      paid: 0,
    };
    entry.count += 1;
    entry.dispatchWeightKg += Number(s.dispatchWeightKg);
    entry.expectedRevenue += Number(s.expectedRevenue);
    entry.finalAmount += s.settlement ? Number(s.settlement.finalSettlementAmount) : 0;
    entry.paid += s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    byBuyer.set(s.buyerId, entry);
  }

  const rows = Array.from(byBuyer.values()).map((e) => ({
    buyerCode: e.buyer.buyerCode,
    companyName: e.buyer.companyName,
    sales: e.count,
    dispatchWeightKg: round2(e.dispatchWeightKg),
    expectedRevenue: round2(e.expectedRevenue),
    finalAmount: round2(e.finalAmount),
    paid: round2(e.paid),
    outstanding: round2(e.finalAmount - e.paid),
  }));

  return {
    columns: [
      { key: 'buyerCode', label: 'Buyer Code' },
      { key: 'companyName', label: 'Buyer' },
      { key: 'sales', label: 'Sales' },
      { key: 'dispatchWeightKg', label: 'Dispatch Weight (kg)' },
      { key: 'expectedRevenue', label: 'Expected Revenue' },
      { key: 'finalAmount', label: 'Final Amount' },
      { key: 'paid', label: 'Paid' },
      { key: 'outstanding', label: 'Outstanding' },
    ],
    rows,
    summary: {
      totalBuyers: rows.length,
      totalFinalAmount: round2(rows.reduce((s, r) => s + r.finalAmount, 0)),
      totalOutstanding: round2(rows.reduce((s, r) => s + r.outstanding, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 6. Farmer payment report — payment-focused view of purchases. There is
// no separate farmer payment ledger (unlike buyers) — see Module 23's
// note on GeneratedDocument — so this reflects each purchase's current
// advance/balance rather than individual payment events.
// ---------------------------------------------------------------------
const getFarmerPaymentReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const purchases = await prisma.purchase.findMany({
    where: {
      ...(filters.farmerId ? { farmerId: filters.farmerId } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { purchaseDate: dateRange(filters) } : {}),
    },
    include: { farmer: true, crop: true },
    orderBy: { purchaseDate: 'desc' },
  });

  const rows = purchases.map((p) => ({
    purchaseNumber: p.purchaseNumber,
    date: dateStr(p.purchaseDate),
    farmer: p.farmer.name,
    crop: p.crop.name,
    grossAmount: Number(p.totalGrossAmount),
    advance: Number(p.advanceAmount),
    paid: Number(p.advanceAmount),
    balance: Number(p.remainingPayable),
  }));

  return {
    columns: [
      { key: 'purchaseNumber', label: 'Purchase #' },
      { key: 'date', label: 'Date' },
      { key: 'farmer', label: 'Farmer' },
      { key: 'crop', label: 'Crop' },
      { key: 'grossAmount', label: 'Gross Amount' },
      { key: 'advance', label: 'Advance' },
      { key: 'paid', label: 'Paid' },
      { key: 'balance', label: 'Balance' },
    ],
    rows,
    summary: {
      totalPaid: round2(rows.reduce((s, r) => s + r.paid, 0)),
      totalBalance: round2(rows.reduce((s, r) => s + r.balance, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 7. Buyer payment report — one row per BuyerPayment.
// ---------------------------------------------------------------------
const getBuyerPaymentReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const payments = await prisma.buyerPayment.findMany({
    where: {
      ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
      ...(filters.status ? { paymentMethod: filters.status as never } : {}),
      ...(filters.cropId ? { sale: { cropId: filters.cropId } } : {}),
      ...(dateRange(filters) ? { paymentDate: dateRange(filters) } : {}),
    },
    include: { buyer: true, sale: { include: { crop: true } } },
    orderBy: { paymentDate: 'desc' },
  });

  const rows = payments.map((p) => ({
    paymentNumber: p.paymentNumber,
    date: dateStr(p.paymentDate),
    buyer: p.buyer.companyName,
    sale: p.sale.saleNumber,
    crop: p.sale.crop.name,
    amount: Number(p.amount),
    method: p.paymentMethod,
    reference: p.transactionReferenceNumber,
  }));

  return {
    columns: [
      { key: 'paymentNumber', label: 'Payment #' },
      { key: 'date', label: 'Date' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'sale', label: 'Sale #' },
      { key: 'crop', label: 'Crop' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'reference', label: 'Reference' },
    ],
    rows,
    summary: { totalPayments: rows.length, totalAmount: round2(rows.reduce((s, r) => s + r.amount, 0)) },
  };
};

// ---------------------------------------------------------------------
// 8. Transport expense report — one row per TransportRecord.
// ---------------------------------------------------------------------
const getTransportExpenseReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const records = await prisma.transportRecord.findMany({
    where: {
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
      ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
      ...(filters.farmerId ? { purchase: { farmerId: filters.farmerId } } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { transportDate: dateRange(filters) } : {}),
    },
    include: {
      transporter: true,
      driver: true,
      vehicle: true,
      crop: true,
      purchase: { include: { farmer: true } },
      buyer: true,
    },
    orderBy: { transportDate: 'desc' },
  });

  const rows = records.map((r) => ({
    date: dateStr(r.transportDate),
    direction: r.direction,
    party: r.direction === 'FARMER_TO_WAREHOUSE' ? r.purchase?.farmer.name ?? null : r.buyer?.companyName ?? null,
    crop: r.crop.name,
    transporter: r.transporter.name,
    driver: r.driver?.name ?? null,
    vehicle: r.vehicle?.vehicleNumber ?? null,
    fromLocation: r.fromLocation,
    toLocation: r.toLocation,
    weightKg: r.weightKg ? Number(r.weightKg) : null,
    cost: Number(r.transportCost),
    status: r.status,
  }));

  return {
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'direction', label: 'Direction' },
      { key: 'party', label: 'Farmer / Buyer' },
      { key: 'crop', label: 'Crop' },
      { key: 'transporter', label: 'Transporter' },
      { key: 'driver', label: 'Driver' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'fromLocation', label: 'From' },
      { key: 'toLocation', label: 'To' },
      { key: 'weightKg', label: 'Weight (kg)' },
      { key: 'cost', label: 'Cost' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summary: { totalTrips: rows.length, totalCost: round2(rows.reduce((s, r) => s + r.cost, 0)) },
  };
};

// ---------------------------------------------------------------------
// 9. Labour report — one row per StaffAssignment.
// ---------------------------------------------------------------------
const getLabourReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const assignments = await prisma.staffAssignment.findMany({
    where: {
      ...(filters.staffId ? { staffId: filters.staffId } : {}),
      ...(filters.cropId ? { purchase: { cropId: filters.cropId } } : {}),
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { assignedDate: dateRange(filters) } : {}),
    },
    include: { staff: true, purchase: { include: { crop: true } } },
    orderBy: { assignedDate: 'desc' },
  });

  const rows = assignments.map((a) => ({
    date: dateStr(a.assignedDate),
    staff: a.staff.name,
    purchase: a.purchase.purchaseNumber,
    crop: a.purchase.crop.name,
    bagsHandled: a.bagsHandled,
    ratePerBag: Number(a.labourRatePerBag),
    totalAmount: Number(a.totalLabourAmount),
    status: a.status,
  }));

  return {
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'staff', label: 'Staff' },
      { key: 'purchase', label: 'Purchase #' },
      { key: 'crop', label: 'Crop' },
      { key: 'bagsHandled', label: 'Bags Handled' },
      { key: 'ratePerBag', label: 'Rate/Bag' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summary: { totalAssignments: rows.length, totalAmount: round2(rows.reduce((s, r) => s + r.totalAmount, 0)) },
  };
};

// ---------------------------------------------------------------------
// 10. Expense report — one row per Expense.
// ---------------------------------------------------------------------
const getExpenseReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const expenses = await prisma.expense.findMany({
    where: {
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(dateRange(filters) ? { expenseDate: dateRange(filters) } : {}),
      ...(filters.cropId
        ? { OR: [{ purchase: { cropId: filters.cropId } }, { sale: { cropId: filters.cropId } }] }
        : {}),
      ...(filters.farmerId ? { purchase: { farmerId: filters.farmerId } } : {}),
      ...(filters.buyerId ? { sale: { buyerId: filters.buyerId } } : {}),
    },
    include: { category: true, purchase: true, sale: true },
    orderBy: { expenseDate: 'desc' },
  });

  const rows = expenses.map((e) => ({
    expenseNumber: e.expenseNumber,
    date: dateStr(e.expenseDate),
    category: e.category.name,
    description: e.description,
    relatedRecord: e.purchase?.purchaseNumber ?? e.sale?.saleNumber ?? null,
    amount: Number(e.amount),
    paymentMethod: e.paymentMethod,
    reference: e.referenceNumber,
    status: e.status,
  }));

  return {
    columns: [
      { key: 'expenseNumber', label: 'Expense #' },
      { key: 'date', label: 'Date' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'relatedRecord', label: 'Related Record' },
      { key: 'amount', label: 'Amount' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'reference', label: 'Reference' },
      { key: 'status', label: 'Status' },
    ],
    rows,
    summary: {
      totalExpenses: rows.length,
      totalAmount: round2(rows.filter((r) => r.status === 'ACTIVE').reduce((s, r) => s + r.amount, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 11. Profit/loss report — reuses Module 22's per-sale P&L exactly, so
// this is never a second, divergent profit calculation.
// ---------------------------------------------------------------------
const getProfitLossReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const sales = await prisma.sale.findMany({
    where: {
      settlement: {
        is: {
          ...(filters.status ? { settlementStatus: filters.status as never } : {}),
          ...(dateRange(filters) ? { receivedDate: dateRange(filters) } : {}),
        },
      },
      ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
      ...(filters.cropId ? { cropId: filters.cropId } : {}),
    },
    select: { id: true, saleNumber: true, buyer: { select: { companyName: true } }, crop: { select: { name: true } } },
  });

  const rows: Record<string, string | number | null>[] = [];
  for (const s of sales) {
    const pnl = await getSaleProfitLoss(s.id);
    rows.push({
      saleNumber: s.saleNumber,
      buyer: s.buyer.companyName,
      crop: s.crop.name,
      revenue: pnl.grossRevenue,
      purchaseCost: pnl.purchaseCost,
      transportCost: pnl.transportCost,
      labourCost: pnl.labourCost,
      otherExpenses: pnl.otherExpenses,
      adjustments: pnl.settlementAdjustmentAmount,
      netProfit: pnl.netProfit,
    });
  }

  const sum = (key: string) =>
    round2(rows.reduce((s, r) => s + (typeof r[key] === 'number' ? (r[key] as number) : 0), 0));

  return {
    columns: [
      { key: 'saleNumber', label: 'Sale #' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'crop', label: 'Crop' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'purchaseCost', label: 'Purchase Cost' },
      { key: 'transportCost', label: 'Transport' },
      { key: 'labourCost', label: 'Labour' },
      { key: 'otherExpenses', label: 'Other Expenses' },
      { key: 'adjustments', label: 'Adjustments' },
      { key: 'netProfit', label: 'Net Profit/Loss' },
    ],
    rows,
    summary: {
      sales: rows.length,
      totalRevenue: sum('revenue'),
      totalPurchaseCost: sum('purchaseCost'),
      totalTransportCost: sum('transportCost'),
      totalLabourCost: sum('labourCost'),
      totalOtherExpenses: sum('otherExpenses'),
      totalAdjustments: sum('adjustments'),
      totalNetProfit: sum('netProfit'),
    },
  };
};

// ---------------------------------------------------------------------
// 12. Weight-loss report — one row per settled sale's weight outcome.
// ---------------------------------------------------------------------
const getWeightLossReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const settlements = await prisma.saleSettlement.findMany({
    where: {
      ...(dateRange(filters) ? { receivedDate: dateRange(filters) } : {}),
      sale: {
        ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
        ...(filters.cropId ? { cropId: filters.cropId } : {}),
      },
    },
    include: { sale: { include: { buyer: true, crop: true } } },
    orderBy: { differencePercentage: 'asc' },
  });

  const rows = settlements.map((s) => ({
    saleNumber: s.sale.saleNumber,
    date: dateStr(s.receivedDate),
    buyer: s.sale.buyer.companyName,
    crop: s.sale.crop.name,
    dispatchWeightKg: Number(s.dispatchWeightKg),
    finalWeightKg: Number(s.buyerFinalWeightKg),
    weightDifferenceKg: Number(s.weightDifferenceKg),
    differencePercentage: Number(s.differencePercentage),
  }));

  return {
    columns: [
      { key: 'saleNumber', label: 'Sale #' },
      { key: 'date', label: 'Date' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'crop', label: 'Crop' },
      { key: 'dispatchWeightKg', label: 'Dispatch Weight (kg)' },
      { key: 'finalWeightKg', label: 'Final Weight (kg)' },
      { key: 'weightDifferenceKg', label: 'Difference (kg)' },
      { key: 'differencePercentage', label: 'Difference (%)' },
    ],
    rows,
    summary: {
      settlements: rows.length,
      totalWeightDifferenceKg: round2(rows.reduce((s, r) => s + r.weightDifferenceKg, 0)),
    },
  };
};

// ---------------------------------------------------------------------
// 13. Quality/rejection report — PRICE_ADJUSTED and REJECTED settlements.
// ---------------------------------------------------------------------
const getQualityRejectionReport = async (filters: ReportQuery): Promise<ReportResult> => {
  const settlements = await prisma.saleSettlement.findMany({
    where: {
      settlementStatus: filters.status ? (filters.status as never) : { in: ['PRICE_ADJUSTED', 'REJECTED'] },
      ...(dateRange(filters) ? { receivedDate: dateRange(filters) } : {}),
      sale: {
        ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
        ...(filters.cropId ? { cropId: filters.cropId } : {}),
      },
    },
    include: { sale: { include: { buyer: true, crop: true } } },
    orderBy: { receivedDate: 'desc' },
  });

  const rows = settlements.map((s) => ({
    saleNumber: s.sale.saleNumber,
    date: dateStr(s.receivedDate),
    buyer: s.sale.buyer.companyName,
    crop: s.sale.crop.name,
    outcome: s.settlementStatus,
    originalRate: Number(s.sellingRatePerKg),
    adjustedRate: s.adjustedSellingRatePerKg ? Number(s.adjustedSellingRatePerKg) : null,
    priceAdjustmentReason: s.priceAdjustmentReason,
    rejectionReason: s.rejectionReason,
    quantityAffectedKg: s.quantityAffectedKg ? Number(s.quantityAffectedKg) : null,
    rejectionAction: s.rejectionAction,
  }));

  return {
    columns: [
      { key: 'saleNumber', label: 'Sale #' },
      { key: 'date', label: 'Date' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'crop', label: 'Crop' },
      { key: 'outcome', label: 'Outcome' },
      { key: 'originalRate', label: 'Original Rate' },
      { key: 'adjustedRate', label: 'Adjusted Rate' },
      { key: 'priceAdjustmentReason', label: 'Price Adjustment Reason' },
      { key: 'rejectionReason', label: 'Rejection Reason' },
      { key: 'quantityAffectedKg', label: 'Quantity Affected (kg)' },
      { key: 'rejectionAction', label: 'Rejection Action' },
    ],
    rows,
    summary: {
      total: rows.length,
      priceAdjusted: rows.filter((r) => r.outcome === 'PRICE_ADJUSTED').length,
      rejected: rows.filter((r) => r.outcome === 'REJECTED').length,
    },
  };
};

const REPORT_GENERATORS: Record<string, (filters: ReportQuery) => Promise<ReportResult>> = {
  farmer: getFarmerReport,
  'crop-purchase': getCropPurchaseReport,
  'crop-sales': getCropSalesReport,
  inventory: getInventoryReport,
  buyer: getBuyerReport,
  'farmer-payment': getFarmerPaymentReport,
  'buyer-payment': getBuyerPaymentReport,
  'transport-expense': getTransportExpenseReport,
  labour: getLabourReport,
  expense: getExpenseReport,
  'profit-loss': getProfitLossReport,
  'weight-loss': getWeightLossReport,
  'quality-rejection': getQualityRejectionReport,
};

export const getReport = async (reportType: string, filters: ReportQuery): Promise<ReportResult> => {
  const generator = REPORT_GENERATORS[reportType];
  if (!generator) throw new Error(`Unknown report type: ${reportType}`);
  return generator(filters);
};
