import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getSaleSettlementForSale,
  createSaleSettlement,
} from '../../services/saleSettlementService';
import type {
  SaleSettlement,
  SaleSettlementFormData,
  SaleSettlementStatus,
  RejectionAction,
} from '../../types/saleSettlement.types';
import TextField from './TextField';
import SelectField from './SelectField';
import Button from './Button';
import Alert from './Alert';
import { formatDate, formatCurrency, formatWeight, formatSignedWeight, formatPercent } from '../../utils/format';
import { extractErrorMessage } from '../../utils/apiError';

const statusLabels: Record<SaleSettlementStatus, string> = {
  ACCEPTED: 'Accepted',
  PRICE_ADJUSTED: 'Accepted — Price Adjusted',
  REJECTED: 'Rejected',
};

const statusBadgeClass: Record<SaleSettlementStatus, string> = {
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  PRICE_ADJUSTED: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const rejectionActionLabels: Record<RejectionAction, string> = {
  RETURN_TO_WAREHOUSE: 'Returned to warehouse',
  RESELL: 'Resold to another buyer',
  DISPOSED_OTHER: 'Disposed / other handling',
};

interface SaleSettlementSectionProps {
  saleId: string;
  saleStatus: string;
  dispatchWeightKg: string;
  sellingRatePerKg: string;
  onSettled?: () => void;
}

const SaleSettlementSection = ({
  saleId,
  saleStatus,
  dispatchWeightKg,
  sellingRatePerKg,
  onSettled,
}: SaleSettlementSectionProps) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'ADMIN';

  const [settlement, setSettlement] = useState<SaleSettlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const emptyForm: SaleSettlementFormData = {
    saleId,
    settlementStatus: 'ACCEPTED',
    buyerFinalWeightKg: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    buyerRemarks: '',
    adjustedSellingRatePerKg: '',
    priceAdjustmentReason: '',
    rejectionReason: '',
    quantityAffectedKg: '',
    rejectionAction: '',
    rejectionActionNotes: '',
    adjustmentAmount: '',
    adjustmentReason: '',
  };
  const [form, setForm] = useState<SaleSettlementFormData>(emptyForm);

  const loadSettlement = () => {
    setIsLoading(true);
    getSaleSettlementForSale(saleId)
      .then(setSettlement)
      .finally(() => setIsLoading(false));
  };

  useEffect(loadSettlement, [saleId]);

  const handleChange =
    (field: keyof SaleSettlementFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleStatusSelect = (status: SaleSettlementStatus) => {
    setForm((prev) => ({ ...prev, settlementStatus: status }));
  };

  // Live preview so the owner can see the weight difference and final
  // settlement amount before saving.
  const originalRate = Number(sellingRatePerKg) || 0;
  const dispatch = Number(dispatchWeightKg) || 0;
  const previewFinalWeight = Number(form.buyerFinalWeightKg) || 0;
  const previewDifference = previewFinalWeight - dispatch;
  const previewPercentage = dispatch > 0 ? (previewDifference / dispatch) * 100 : 0;
  const previewAdjustment = Number(form.adjustmentAmount) || 0;
  const previewEffectiveRate =
    form.settlementStatus === 'PRICE_ADJUSTED' && form.adjustedSellingRatePerKg
      ? Number(form.adjustedSellingRatePerKg)
      : originalRate;
  const previewFinalAmount = previewFinalWeight * previewEffectiveRate + previewAdjustment;
  const hasPreview = form.buyerFinalWeightKg !== '';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const created = await createSaleSettlement(form);
      setSettlement(created);
      setIsAdding(false);
      onSettled?.();
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Could not save delivery settlement.'));
    } finally {
      setIsSaving(false);
    }
  };

  const diffColor = (diff: number) => {
    if (diff === 0) return 'text-gray-600';
    return diff < 0 ? 'text-red-600' : 'text-blue-600';
  };

  const canRecordSettlement = saleStatus === 'DISPATCHED';

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Buyer Delivery Settlement
      </h3>

      {error && (
        <div className="mb-3">
          <Alert type="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading settlement...</p>
      ) : settlement ? (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          <div className="px-4 py-3 flex justify-between items-center text-sm">
            <span className="text-gray-500">Outcome</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass[settlement.settlementStatus]}`}
            >
              {statusLabels[settlement.settlementStatus]}
            </span>
          </div>
          {[
            ['Received Date', formatDate(settlement.receivedDate)],
            ['Dispatch Weight', `${formatWeight(settlement.dispatchWeightKg)}`],
            ['Buyer Final Weight', `${formatWeight(settlement.buyerFinalWeightKg)}`],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-800 font-medium">{value}</span>
            </div>
          ))}
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-500">Weight Difference</span>
            <span className={`font-semibold ${diffColor(Number(settlement.weightDifferenceKg))}`}>
              {formatSignedWeight(settlement.weightDifferenceKg)} (
              {formatPercent(settlement.differencePercentage)})
            </span>
          </div>

          {settlement.settlementStatus === 'PRICE_ADJUSTED' && (
            <>
              <div className="px-4 py-3 flex justify-between text-sm bg-amber-50">
                <span className="text-amber-800">Original Rate → Adjusted Rate</span>
                <span className="text-amber-900 font-medium">
                  {formatCurrency(settlement.sellingRatePerKg)} →{' '}
                  {formatCurrency(settlement.adjustedSellingRatePerKg)} / kg
                </span>
              </div>
              {settlement.priceAdjustmentReason && (
                <div className="px-4 py-3 text-sm">
                  <span className="text-gray-500 block mb-1">Reason</span>
                  <span className="text-gray-800">{settlement.priceAdjustmentReason}</span>
                </div>
              )}
            </>
          )}

          {settlement.settlementStatus === 'REJECTED' && (
            <>
              <div className="px-4 py-3 text-sm bg-red-50">
                <span className="text-red-800 block mb-1">Rejection Reason</span>
                <span className="text-red-900">{settlement.rejectionReason}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-500">Quantity Affected</span>
                <span className="text-gray-800 font-medium">
                  {formatWeight(settlement.quantityAffectedKg)}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-500">Action Taken</span>
                <span className="text-gray-800 font-medium">
                  {settlement.rejectionAction ? rejectionActionLabels[settlement.rejectionAction] : '—'}
                </span>
              </div>
              {settlement.rejectionActionNotes && (
                <div className="px-4 py-3 text-sm">
                  <span className="text-gray-500 block mb-1">Action Notes</span>
                  <span className="text-gray-800">{settlement.rejectionActionNotes}</span>
                </div>
              )}
            </>
          )}

          {Number(settlement.adjustmentAmount) !== 0 && (
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">
                Other Adjustment{settlement.adjustmentReason ? ` (${settlement.adjustmentReason})` : ''}
              </span>
              <span className="text-gray-800 font-medium">
                {Number(settlement.adjustmentAmount) > 0 ? '+' : ''}
                {formatCurrency(settlement.adjustmentAmount)}
              </span>
            </div>
          )}
          <div className="px-4 py-3 flex justify-between text-sm bg-green-50">
            <span className="text-green-800 font-medium">Final Settlement Amount</span>
            <span className="text-green-900 font-semibold">
              {formatCurrency(settlement.finalSettlementAmount)}
            </span>
          </div>
          {settlement.buyerRemarks && (
            <div className="px-4 py-3 text-sm">
              <span className="text-gray-500 block mb-1">Buyer Remarks</span>
              <span className="text-gray-800">{settlement.buyerRemarks}</span>
            </div>
          )}
        </div>
      ) : canRecordSettlement ? (
        isAdding ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Buyer's Decision *
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ACCEPTED', 'PRICE_ADJUSTED', 'REJECTED'] as SaleSettlementStatus[]).map(
                  (status) => {
                    const disabled = status !== 'ACCEPTED' && !isOwner;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleStatusSelect(status)}
                        title={disabled ? 'Only the owner can authorize this outcome.' : undefined}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          form.settlementStatus === status
                            ? 'bg-green-700 text-white border-green-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-700'
                        }`}
                      >
                        {statusLabels[status]}
                      </button>
                    );
                  }
                )}
              </div>
              {!isOwner && (
                <p className="text-xs text-gray-400 mt-1">
                  Only the owner can authorize a price-adjusted or rejected settlement.
                </p>
              )}
            </div>

            <TextField
              label={`Buyer Final Weight (kg)${form.settlementStatus === 'REJECTED' ? ' (0 if fully rejected)' : ' *'}`}
              type="number"
              step="0.001"
              min="0"
              value={form.buyerFinalWeightKg}
              onChange={handleChange('buyerFinalWeightKg')}
              hint="What the buyer's own scale reported when the truck arrived."
              required={form.settlementStatus !== 'REJECTED'}
            />
            <TextField
              label="Received Date *"
              type="date"
              value={form.receivedDate}
              onChange={handleChange('receivedDate')}
              required
            />

            {form.settlementStatus === 'PRICE_ADJUSTED' && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 flex flex-col gap-3">
                <TextField
                  label="Adjusted Selling Rate (₹/kg) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.adjustedSellingRatePerKg}
                  onChange={handleChange('adjustedSellingRatePerKg')}
                  hint={`Original agreed rate ${formatCurrency(originalRate)}/kg is kept unchanged — this is recorded separately.`}
                  required
                />
                <TextField
                  label="Reason *"
                  value={form.priceAdjustmentReason}
                  onChange={handleChange('priceAdjustmentReason')}
                  placeholder="e.g. lower grade than agreed on arrival"
                  required
                />
              </div>
            )}

            {form.settlementStatus === 'REJECTED' && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 flex flex-col gap-3">
                <TextField
                  label="Rejection Reason *"
                  value={form.rejectionReason}
                  onChange={handleChange('rejectionReason')}
                  placeholder="e.g. spoiled in transit"
                  required
                />
                <TextField
                  label="Quantity Affected (kg) *"
                  type="number"
                  step="0.001"
                  min="0"
                  max={dispatch || undefined}
                  value={form.quantityAffectedKg}
                  onChange={handleChange('quantityAffectedKg')}
                  hint="How much of the dispatched quantity was rejected."
                  required
                />
                <div>
                  <SelectField
                    label="Action Taken"
                    value={form.rejectionAction}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        rejectionAction: e.target.value as RejectionAction | '',
                      }))
                    }
                    required
                  >
                    <option value="">Select an action</option>
                    {(Object.keys(rejectionActionLabels) as RejectionAction[]).map((action) => (
                      <option key={action} value={action}>
                        {rejectionActionLabels[action]}
                      </option>
                    ))}
                  </SelectField>
                  {form.rejectionAction === 'RETURN_TO_WAREHOUSE' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock will be automatically restored to the warehouse for this quantity.
                    </p>
                  )}
                </div>
                <TextField
                  label="Action Notes (optional)"
                  value={form.rejectionActionNotes}
                  onChange={handleChange('rejectionActionNotes')}
                  placeholder="e.g. resold to Buyer XYZ at ₹.../kg"
                />
              </div>
            )}

            <TextField
              label="Other Settlement Adjustment (₹, optional)"
              type="number"
              step="0.01"
              value={form.adjustmentAmount}
              onChange={handleChange('adjustmentAmount')}
              hint="Any additional flat deduction (negative) or bonus (positive) not covered above."
            />
            {form.adjustmentAmount && (
              <TextField
                label="Adjustment Reason (optional)"
                value={form.adjustmentReason}
                onChange={handleChange('adjustmentReason')}
              />
            )}

            <TextField
              label="Buyer Remarks (optional)"
              value={form.buyerRemarks}
              onChange={handleChange('buyerRemarks')}
            />

            {hasPreview && (
              <div className="bg-gray-50 rounded-md p-3 text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Dispatch: {formatWeight(dispatch)} → Buyer: {formatWeight(previewFinalWeight)}
                  </span>
                  <span className={`font-semibold ${diffColor(previewDifference)}`}>
                    {formatSignedWeight(previewDifference)} ({formatPercent(previewPercentage)})
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                  <span className="text-gray-500">
                    Final settlement amount (@ {formatCurrency(previewEffectiveRate)}/kg)
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(Number.isFinite(previewFinalAmount) ? previewFinalAmount : 0)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving} className="flex-1">
                Save Settlement
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              This sale has been dispatched. Record the buyer's decision once the truck arrives.
            </p>
            <Button onClick={() => setIsAdding(true)}>Record Settlement</Button>
          </div>
        )
      ) : (
        <p className="text-sm text-gray-400">
          A delivery settlement can be recorded once this sale is DISPATCHED.
        </p>
      )}
    </div>
  );
};

export default SaleSettlementSection;
