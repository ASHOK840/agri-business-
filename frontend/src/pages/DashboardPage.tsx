import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/dashboardService';
import type { Dashboard } from '../types/dashboard.types';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/common/Alert';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';
import {
  IconBag,
  IconTrendingUp,
  IconReceipt,
  IconWallet,
  IconBoxes,
  IconUsers,
  IconBuilding,
  IconAlertTriangle,
  IconXCircle,
  IconClock,
  IconTruck,
  IconChevronRight,
  IconCheckCircle,
} from '../components/common/icons';
import { formatCurrency as money, formatDate, formatWeight } from '../utils/format';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// Icon chips carry the only color variation on a stat card — meaning,
// not decoration. Same five tones everywhere: green = positive, amber =
// needs attention, red = critical, sky = informational, gray = neutral.
const iconToneStyles = {
  sky: 'bg-sky-50 text-sky-600',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-500',
} as const;

type IconTone = keyof typeof iconToneStyles;
type Tone = 'positive' | 'warning' | 'critical';

const toneToIconTone: Record<Tone, IconTone> = { positive: 'green', warning: 'amber', critical: 'red' };
const toneToTextColor: Record<Tone, string> = {
  positive: 'text-green-700',
  warning: 'text-amber-700',
  critical: 'text-red-600',
};

const StatCard = ({
  label,
  value,
  sub,
  tone,
  iconTone = 'gray',
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  iconTone?: IconTone;
  icon: IconType;
}) => {
  const resolvedIconTone = tone ? toneToIconTone[tone] : iconTone;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconToneStyles[resolvedIconTone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 truncate">{label}</p>
      </div>
      <p className={`text-lg font-bold ${tone ? toneToTextColor[tone] : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const SectionTitle = ({
  children,
  action,
}: {
  children: string;
  action?: { label: string; to?: string; onClick?: () => void };
}) => (
  <div className="flex items-center justify-between mt-6 mb-2.5">
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{children}</h3>
    {action &&
      (action.to ? (
        <Link to={action.to} className="text-xs font-medium text-green-700 hover:text-green-800 flex items-center gap-0.5">
          {action.label}
          <IconChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-medium text-green-700 hover:text-green-800 flex items-center gap-0.5"
        >
          {action.label}
          <IconChevronRight className="h-3.5 w-3.5" />
        </button>
      ))}
  </div>
);

const profitTone = (n: number): Tone | undefined => (n > 0 ? 'positive' : n < 0 ? 'critical' : undefined);

type ActivityType = 'Purchase' | 'Sale' | 'Payment' | 'Expense';

interface ActivityItem {
  id: string;
  type: ActivityType;
  date: string;
  primary: string;
  secondary: string;
  amount: number;
  link?: string;
}

const activityBadgeStyles: Record<ActivityType, string> = {
  Purchase: 'bg-sky-100 text-sky-700',
  Sale: 'bg-green-100 text-green-700',
  Payment: 'bg-purple-100 text-purple-700',
  Expense: 'bg-amber-100 text-amber-700',
};

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const row = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${activityBadgeStyles[item.type]}`}>
          {item.type}
        </span>
        <span className="truncate text-sm text-gray-700">{item.secondary}</span>
      </div>
      <span className="text-sm font-semibold text-gray-800 shrink-0 ml-3">{money(item.amount)}</span>
    </>
  );
  return item.link ? (
    <Link to={item.link} className="flex items-center justify-between gap-3 px-3.5 py-2 hover:bg-gray-50">
      {row}
    </Link>
  ) : (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2">{row}</div>
  );
};

interface AlertSummaryConfig {
  key: keyof Dashboard['alerts'];
  title: string;
  icon: IconType;
  tone: Extract<Tone, 'warning' | 'critical'> | 'info';
  link: string;
  amount?: number;
}

const alertToneStyles: Record<AlertSummaryConfig['tone'], { bg: string; border: string; icon: string; text: string }> = {
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700', text: 'text-amber-900' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-100 text-red-700', text: 'text-red-900' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700', text: 'text-blue-900' },
};

// Most urgent first: critical issues surface before routine reminders,
// so the four cards shown before "View all" are the ones actually worth
// seeing without an extra click.
const alertTonePriority: Record<AlertSummaryConfig['tone'], number> = { critical: 0, warning: 1, info: 2 };

const ALERTS_PREVIEW_COUNT = 4;

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((err) => setError(err?.response?.data?.message || 'Could not load dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-3xl mx-auto mt-6">
        <Alert type="error" message={error || 'Could not load dashboard.'} />
      </div>
    );
  }

  const { today, current, profit, inventory, recent, alerts } = dashboard;
  const alertCount = alerts.totalCount;

  const activity: ActivityItem[] = [
    ...recent.purchases.map((p) => ({
      id: `purchase-${p.id}`,
      type: 'Purchase' as const,
      date: p.purchaseDate,
      primary: p.purchaseNumber,
      secondary: p.farmer.name,
      amount: p.totalGrossAmount,
      link: `/purchases/${p.id}`,
    })),
    ...recent.sales.map((s) => ({
      id: `sale-${s.id}`,
      type: 'Sale' as const,
      date: s.saleDate,
      primary: s.saleNumber,
      secondary: s.buyer.companyName,
      amount: s.expectedRevenue,
      link: `/sales/${s.id}`,
    })),
    ...recent.payments.map((p) => ({
      id: `payment-${p.id}`,
      type: 'Payment' as const,
      date: p.paymentDate,
      primary: p.paymentNumber,
      secondary: p.buyer.companyName,
      amount: p.amount,
    })),
    ...recent.expenses.map((e) => ({
      id: `expense-${e.id}`,
      type: 'Expense' as const,
      date: e.expenseDate,
      primary: e.expenseNumber,
      secondary: e.category.name,
      amount: e.amount,
      link: `/expenses/${e.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);
  const activityMidpoint = Math.ceil(activity.length / 2);
  const activityColumns = [activity.slice(0, activityMidpoint), activity.slice(activityMidpoint)];

  const visibleInventory = inventory.slice(0, 6);
  const hasMoreInventory = inventory.length > visibleInventory.length;

  const alertConfigList: AlertSummaryConfig[] = [
    {
      key: 'farmerPaymentsPending',
      title: 'Farmer Payments Pending',
      icon: IconAlertTriangle,
      tone: 'warning',
      link: '/purchases',
      amount: alerts.farmerPaymentsPending.reduce((sum, a) => sum + a.remainingPayable, 0),
    },
    {
      key: 'buyerPaymentsPending',
      title: 'Buyer Payments Pending',
      icon: IconAlertTriangle,
      tone: 'warning',
      link: '/sales',
      amount: alerts.buyerPaymentsPending.reduce((sum, a) => sum + a.outstanding, 0),
    },
    { key: 'salesRejected', title: 'Sales Rejected', icon: IconXCircle, tone: 'critical', link: '/sales' },
    { key: 'qualityPriceReductions', title: 'Quality Price Reductions', icon: IconAlertTriangle, tone: 'warning', link: '/sales' },
    { key: 'significantWeightLoss', title: 'Significant Weight Loss', icon: IconAlertTriangle, tone: 'warning', link: '/sales' },
    { key: 'lowStock', title: 'Low Stock', icon: IconAlertTriangle, tone: 'critical', link: '/inventory' },
    { key: 'pendingPurchaseCollection', title: 'Pending Purchase Collection', icon: IconClock, tone: 'info', link: '/purchases' },
    { key: 'pendingTransport', title: 'Pending Transport', icon: IconTruck, tone: 'info', link: '/transport-records' },
    { key: 'pendingSettlement', title: 'Pending Settlement', icon: IconClock, tone: 'info', link: '/sales' },
  ];
  const alertConfigs = alertConfigList
    .filter((config) => (alerts[config.key] as unknown[]).length > 0)
    .sort((a, b) => alertTonePriority[a.tone] - alertTonePriority[b.tone]);
  const visibleAlertConfigs = showAllAlerts ? alertConfigs : alertConfigs.slice(0, ALERTS_PREVIEW_COUNT);
  const hiddenAlertCount = alertConfigs.length - visibleAlertConfigs.length;

  return (
    <div className="max-w-5xl mx-auto mt-4 mb-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Here's how the business looks right now — all figures are calculated live from actual records."
        action={
          <span className="text-xs text-green-100 bg-black/10 rounded-full px-3 py-1">
            As of {formatDate(dashboard.generatedAt)}
          </span>
        }
      />

      <SectionTitle>Today</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard icon={IconBag} iconTone="sky" label="Purchases" value={money(today.purchases.totalAmount)} sub={`${today.purchases.count} recorded today`} />
        <StatCard icon={IconTrendingUp} iconTone="green" label="Sales" value={money(today.sales.totalAmount)} sub={`${today.sales.count} recorded today`} />
        <StatCard icon={IconReceipt} iconTone="amber" label="Expenses" value={money(today.expenses.totalAmount)} sub={`${today.expenses.count} recorded today`} />
        <StatCard icon={IconWallet} iconTone="purple" label="Payments" value={money(today.payments.totalAmount)} sub={`${today.payments.count} received today`} />
      </div>

      <SectionTitle>Current Position</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <StatCard icon={IconBoxes} iconTone="sky" label="Warehouse Stock" value={formatWeight(current.warehouseStockTotalKg)} />
        <StatCard
          icon={IconUsers}
          label="Farmer Outstanding"
          value={money(current.farmerOutstanding)}
          tone={current.farmerOutstanding > 0 ? 'warning' : undefined}
        />
        <StatCard
          icon={IconBuilding}
          label="Buyer Outstanding"
          value={money(current.buyerOutstanding)}
          tone={current.buyerOutstanding > 0 ? 'warning' : undefined}
        />
      </div>

      <SectionTitle>Profit</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard icon={IconTrendingUp} label="Today" value={money(profit.today)} tone={profitTone(profit.today)} />
        <StatCard icon={IconTrendingUp} label="This Week" value={money(profit.thisWeek)} tone={profitTone(profit.thisWeek)} />
        <StatCard icon={IconTrendingUp} label="This Month" value={money(profit.thisMonth)} tone={profitTone(profit.thisMonth)} />
        <StatCard icon={IconTrendingUp} label="This Year" value={money(profit.thisYear)} tone={profitTone(profit.thisYear)} />
      </div>

      <SectionTitle action={{ label: 'View all inventory', to: '/inventory' }}>Inventory</SectionTitle>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No crops configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Crop</th>
                  <th className="px-4 py-2 font-medium">Current Stock</th>
                  <th className="px-4 py-2 font-medium">Bags</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleInventory.map((item) => (
                  <tr key={item.cropId} className={item.isLowStock ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 text-gray-800 font-medium">{item.cropName}</td>
                    <td className="px-4 py-2 text-gray-800">{formatWeight(item.currentStockKg)}</td>
                    <td className="px-4 py-2 text-gray-500">{item.currentStockBags}</td>
                    <td className="px-4 py-2">
                      {item.isLowStock && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {hasMoreInventory && (
          <Link
            to="/inventory"
            className="block text-center text-sm font-medium text-green-700 hover:bg-gray-50 py-2 border-t border-gray-100"
          >
            View all inventory ({inventory.length} crops) →
          </Link>
        )}
      </div>

      <SectionTitle action={{ label: 'View all', to: '/reports' }}>Recent Activity</SectionTitle>
      {activity.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activityColumns.map((column, columnIndex) =>
            column.length > 0 ? (
              <div key={columnIndex} className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                {column.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>
            ) : null
          )}
        </div>
      )}

      <SectionTitle>{`Important Alerts${alertCount > 0 ? ` (${alertCount})` : ''}`}</SectionTitle>
      {alertCount === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3.5 text-sm text-green-800 flex items-center gap-2">
          <IconCheckCircle className="h-4 w-4 shrink-0" />
          No open issues right now.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {visibleAlertConfigs.map((config) => {
              const items = alerts[config.key] as unknown[];
              const style = alertToneStyles[config.tone];
              const Icon = config.icon;
              return (
                <Link
                  key={config.key}
                  to={config.link}
                  className={`rounded-lg border ${style.border} ${style.bg} p-3.5 flex items-start gap-3 hover:shadow-sm transition-shadow`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${style.icon}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${style.text}`}>{config.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {items.length} {items.length === 1 ? 'record' : 'records'}
                      {config.amount !== undefined && config.amount > 0 ? ` · ${money(config.amount)}` : ''}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-700 mt-1.5">
                      View details
                      <IconChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          {alertConfigs.length > ALERTS_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllAlerts((v) => !v)}
              className="mt-2.5 w-full text-center text-sm font-medium text-green-700 hover:text-green-800 py-1.5"
            >
              {showAllAlerts ? 'Show fewer alerts ↑' : `View all alerts (${hiddenAlertCount} more) →`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
