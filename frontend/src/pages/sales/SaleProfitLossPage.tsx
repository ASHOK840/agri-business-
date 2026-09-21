import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSaleProfitLoss } from '../../services/profitLossService';
import type { SaleProfitLoss } from '../../types/profitLoss.types';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import { formatCurrency as money, formatWeight, formatSignedWeight } from '../../utils/format';

const Row = ({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: 'positive' | 'negative';
}) => (
  <div className={`px-4 py-3 flex justify-between text-sm ${emphasis ? 'bg-gray-50' : ''}`}>
    <span className={emphasis ? 'text-gray-700 font-medium' : 'text-gray-500'}>{label}</span>
    <span
      className={`font-medium ${
        emphasis ? 'font-semibold' : ''
      } ${tone === 'positive' ? 'text-green-700' : tone === 'negative' ? 'text-red-600' : 'text-gray-800'}`}
    >
      {value}
    </span>
  </div>
);

const SaleProfitLossPage = () => {
  const { id } = useParams<{ id: string }>();
  const [pnl, setPnl] = useState<SaleProfitLoss | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getSaleProfitLoss(id)
      .then(setPnl)
      .catch((err) => setError(err?.response?.data?.message || 'Could not load profit/loss.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <LoadingState label="Loading profit/loss..." />;
  }

  if (error || !pnl) {
    return (
      <div className="max-w-2xl mx-auto mt-6">
        <div className="mb-4">
          <Link to={`/sales/${id}`} className="text-green-700 hover:underline text-sm">
            ← Back to sale
          </Link>
        </div>
        <Alert type="error" message={error || 'Could not load profit/loss.'} />
      </div>
    );
  }

  const netTone = pnl.netProfit === null ? undefined : pnl.netProfit >= 0 ? 'positive' : 'negative';
  const grossTone =
    pnl.grossProfit === null ? undefined : pnl.grossProfit >= 0 ? 'positive' : 'negative';

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="mb-4">
        <Link to={`/sales/${id}`} className="text-green-700 hover:underline text-sm">
          ← Back to sale
        </Link>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-800">Profit &amp; Loss</h2>
        <span className="text-sm text-gray-500">{pnl.saleNumber}</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {pnl.buyer.companyName} · {pnl.crop.name}
      </p>

      {pnl.notes.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {pnl.notes.map((note, i) => (
            <Alert key={i} type="warning" message={note} />
          ))}
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Weight</h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        <Row label="Dispatch Weight" value={formatWeight(pnl.dispatchWeightKg)} />
        <Row label="Final Buyer Weight" value={formatWeight(pnl.buyerFinalWeightKg)} />
        <Row
          label="Weight Difference"
          value={formatSignedWeight(pnl.weightDifferenceKg)}
          tone={pnl.weightDifferenceKg < 0 ? 'negative' : undefined}
        />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Revenue</h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        <Row label="Selling Rate (agreed)" value={`${money(pnl.sellingRatePerKg)}/kg`} />
        {pnl.settlementStatus === 'PRICE_ADJUSTED' && (
          <Row
            label="Effective Rate (adjusted)"
            value={`${money(pnl.effectiveSellingRatePerKg)}/kg`}
          />
        )}
        <Row label="Revenue" value={money(pnl.revenue)} />
        {pnl.settlementAdjustmentAmount !== 0 && (
          <Row label="Settlement Adjustment" value={money(pnl.settlementAdjustmentAmount)} />
        )}
        <Row label="Gross Revenue" value={money(pnl.grossRevenue)} emphasis />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Costs</h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        <Row
          label="Purchase Cost"
          value={
            pnl.costBasisAvailable
              ? `${money(pnl.purchaseCost)} (${money(pnl.purchaseCostPerKg)}/kg avg.)`
              : 'Not determinable'
          }
        />
        {pnl.weightLossValue !== null && pnl.weightLossKg > 0 && (
          <Row
            label={`Value of Weight Loss (${formatWeight(pnl.weightLossKg)})`}
            value={money(pnl.weightLossValue)}
            tone="negative"
          />
        )}
        <Row label="Transport" value={money(pnl.transportCost)} />
        <Row label="Labour" value={money(pnl.labourCost)} />
        <Row label="Other Expenses" value={money(pnl.otherExpenses)} />
        <Row label="Total Cost" value={money(pnl.totalCost)} emphasis />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Profit / Loss
      </h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
        <Row label="Gross Profit" value={money(pnl.grossProfit)} emphasis tone={grossTone} />
        <Row label="Net Profit" value={money(pnl.netProfit)} emphasis tone={netTone} />
        <Row label="Profit per kg" value={money(pnl.profitPerKg)} />
        <Row
          label={`Profit per ${pnl.crop.defaultBagWeightKg}kg bag`}
          value={money(pnl.profitPerBag)}
        />
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Internal Reference Only
      </h3>
      <div className="bg-amber-50 rounded-lg border border-amber-200 divide-y divide-amber-100 mb-6">
        <div className="px-4 py-3 flex justify-between text-sm">
          <span className="text-amber-800">Margin per 48kg bag (trade reference)</span>
          <span className="text-amber-900 font-medium">{money(pnl.referenceMarginPer48kgBag)}</span>
        </div>
        <div className="px-4 py-2 text-xs text-amber-700">
          This is a traditional trade-unit reference, not the crop's actual bag weight — it is
          NOT accounting profit and should never be reported as such.
        </div>
      </div>
    </div>
  );
};

export default SaleProfitLossPage;
