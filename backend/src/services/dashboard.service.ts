import prisma from '../config/prismaClient';
import { getCurrentStock } from './inventory.service';
import { getSaleProfitLoss } from './profitLoss.service';
import { getAlerts } from './alert.service';

const RECENT_LIMIT = 5;

const round2 = (n: number) => Math.round(n * 100) / 100;

// UTC, not server-local time: every date-only field in this app
// (purchaseDate, saleDate, expenseDate, paymentDate, ...) is stored as
// UTC midnight for whatever calendar date was typed in — z.coerce.date()
// on a plain "YYYY-MM-DD" string always parses to UTC midnight. Using
// local-time boundaries here would silently misalign "today" from that
// convention on any server not running in UTC (e.g. IST is +5:30, so a
// record dated "today" could fall outside a local-midnight window).
const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const startOfWeek = (d: Date) => {
  // Monday as the first day of the business week.
  const x = startOfDay(d);
  const day = x.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
};

const startOfMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const startOfYear = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

export const getDashboard = async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  // ---------------------------------------------------------------------
  // Today's activity
  // ---------------------------------------------------------------------
  const [
    todaysPurchases,
    todaysSales,
    todaysExpenses,
    todaysPayments,
  ] = await Promise.all([
    prisma.purchase.findMany({
      where: { purchaseDate: { gte: todayStart, lt: tomorrowStart } },
      select: { totalGrossAmount: true },
    }),
    prisma.sale.findMany({
      where: { saleDate: { gte: todayStart, lt: tomorrowStart } },
      select: { expectedRevenue: true },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: todayStart, lt: tomorrowStart }, status: 'ACTIVE' },
      select: { amount: true },
    }),
    prisma.buyerPayment.findMany({
      where: { paymentDate: { gte: todayStart, lt: tomorrowStart } },
      select: { amount: true },
    }),
  ]);

  const sumBy = <T>(rows: T[], getAmount: (row: T) => unknown) =>
    round2(rows.reduce((sum, row) => sum + Number(getAmount(row)), 0));

  const today = {
    purchases: {
      count: todaysPurchases.length,
      totalAmount: sumBy(todaysPurchases, (p) => p.totalGrossAmount),
    },
    sales: { count: todaysSales.length, totalAmount: sumBy(todaysSales, (s) => s.expectedRevenue) },
    expenses: { count: todaysExpenses.length, totalAmount: sumBy(todaysExpenses, (e) => e.amount) },
    payments: { count: todaysPayments.length, totalAmount: sumBy(todaysPayments, (p) => p.amount) },
  };

  // ---------------------------------------------------------------------
  // Current position: stock, farmer outstanding, buyer outstanding
  // ---------------------------------------------------------------------
  const inventory = await getCurrentStock({});
  const warehouseStockTotalKg = round2(inventory.reduce((sum, c) => sum + c.currentStockKg, 0));

  const outstandingPurchases = await prisma.purchase.findMany({
    where: { status: { not: 'CANCELLED' }, remainingPayable: { gt: 0 } },
    select: {
      id: true,
      purchaseNumber: true,
      remainingPayable: true,
      purchaseDate: true,
      farmer: { select: { id: true, farmerCode: true, name: true } },
    },
    orderBy: { purchaseDate: 'desc' },
  });
  const farmerOutstanding = round2(
    outstandingPurchases.reduce((sum, p) => sum + Number(p.remainingPayable), 0)
  );

  const settledSales = await prisma.sale.findMany({
    where: { settlement: { isNot: null } },
    select: {
      id: true,
      saleNumber: true,
      saleDate: true,
      buyer: { select: { id: true, buyerCode: true, companyName: true } },
      settlement: { select: { finalSettlementAmount: true, receivedDate: true, settlementStatus: true } },
      payments: { select: { amount: true } },
    },
  });

  const salesWithOutstanding = settledSales
    .map((s) => {
      const finalAmount = Number(s.settlement!.finalSettlementAmount);
      const paid = round2(s.payments.reduce((sum, p) => sum + Number(p.amount), 0));
      const outstanding = round2(finalAmount - paid);
      return { ...s, finalAmount, paid, outstanding };
    })
    .filter((s) => s.outstanding > 0);

  const buyerOutstanding = round2(salesWithOutstanding.reduce((sum, s) => sum + s.outstanding, 0));

  const current = { warehouseStockTotalKg, farmerOutstanding, buyerOutstanding };

  // ---------------------------------------------------------------------
  // Profit — computed from real per-sale P&L (Module 22), bucketed by
  // the settlement's received date (when the sale was actually
  // completed), never a fixed/estimated figure.
  // ---------------------------------------------------------------------
  const saleIdsSettledThisYear = settledSales
    .filter((s) => s.settlement!.receivedDate >= yearStart)
    .map((s) => ({ id: s.id, receivedDate: s.settlement!.receivedDate }));

  let profitToday = 0;
  let profitThisWeek = 0;
  let profitThisMonth = 0;
  let profitThisYear = 0;

  for (const { id, receivedDate } of saleIdsSettledThisYear) {
    const pnl = await getSaleProfitLoss(id);
    const net = pnl.netProfit ?? 0;
    profitThisYear += net;
    if (receivedDate >= monthStart) profitThisMonth += net;
    if (receivedDate >= weekStart) profitThisWeek += net;
    if (receivedDate >= todayStart && receivedDate < tomorrowStart) profitToday += net;
  }

  const profit = {
    today: round2(profitToday),
    thisWeek: round2(profitThisWeek),
    thisMonth: round2(profitThisMonth),
    thisYear: round2(profitThisYear),
  };

  // ---------------------------------------------------------------------
  // Recent activity
  // ---------------------------------------------------------------------
  const [recentPurchases, recentSales, recentPayments, recentExpenses] = await Promise.all([
    prisma.purchase.findMany({
      include: { farmer: { select: { id: true, farmerCode: true, name: true } }, crop: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    }),
    prisma.sale.findMany({
      include: { buyer: { select: { id: true, buyerCode: true, companyName: true } }, crop: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    }),
    prisma.buyerPayment.findMany({
      include: { buyer: { select: { id: true, buyerCode: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    }),
    prisma.expense.findMany({
      where: { status: 'ACTIVE' },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    }),
  ]);

  const recent = {
    purchases: recentPurchases.map((p) => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      farmer: p.farmer,
      crop: p.crop,
      totalGrossAmount: Number(p.totalGrossAmount),
      purchaseDate: p.purchaseDate,
    })),
    sales: recentSales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      buyer: s.buyer,
      crop: s.crop,
      expectedRevenue: Number(s.expectedRevenue),
      status: s.status,
      saleDate: s.saleDate,
    })),
    payments: recentPayments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      buyer: p.buyer,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
    })),
    expenses: recentExpenses.map((e) => ({
      id: e.id,
      expenseNumber: e.expenseNumber,
      category: e.category,
      amount: Number(e.amount),
      expenseDate: e.expenseDate,
    })),
  };

  // ---------------------------------------------------------------------
  // Alerts — Module 28's Business Alerts system (see alert.service.ts)
  // is the single source of truth; the dashboard just surfaces it.
  // ---------------------------------------------------------------------
  const alerts = await getAlerts();

  return {
    generatedAt: now,
    today,
    current,
    profit,
    inventory,
    recent,
    alerts,
  };
};
