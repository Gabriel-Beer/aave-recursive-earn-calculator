'use client';

import React, { useState, useEffect } from 'react';
import { CustomAsset } from '@/types/customAssets';
import { useCustomAssets } from '@/hooks/useCustomAssets';
import { ASSET_METADATA } from '@/services/aaveService';

interface Props {
  asset?: CustomAsset | null;
  onSave: (asset: CustomAsset) => void;
  onCancel: () => void;
}

export const CustomAssetForm: React.FC<Props> = ({ asset, onSave, onCancel }) => {
  const { createAsset, updateAsset, validate } = useCustomAssets();

  // Form state
  const [type, setType] = useState<'custom' | 'override'>(asset?.type || 'custom');
  const [symbol, setSymbol] = useState(asset?.symbol || '');
  const [name, setName] = useState(asset?.name || '');
  const [category, setCategory] = useState(asset?.category || 'Other');
  const [ltv, setLtv] = useState(asset ? (parseFloat(asset.ltv) * 100).toString() : '75');
  const [liquidationThreshold, setLiquidationThreshold] = useState(
    asset ? (parseFloat(asset.liquidationThreshold) * 100).toString() : '80'
  );
  const [supplyAPY, setSupplyAPY] = useState(
    asset && asset.liquidityRate ? (parseFloat(asset.liquidityRate) * 100).toString() : ''
  );
  const [borrowAPY, setBorrowAPY] = useState(
    asset && asset.variableBorrowRate ? (parseFloat(asset.variableBorrowRate) * 100).toString() : ''
  );
  const [address, setAddress] = useState(asset?.address || '');
  const [decimals, setDecimals] = useState(asset?.decimals?.toString() || '18');
  const [notes, setNotes] = useState(asset?.notes || '');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get live assets for override selection
  const liveAssets = Object.entries(ASSET_METADATA)
    .filter(([s]) => s !== 'WETH')
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Validate form on changes
  useEffect(() => {
    if (errors.length > 0) {
      validateForm();
    }
  }, [symbol, name, ltv, liquidationThreshold]);

  const validateForm = () => {
    const formData: Partial<CustomAsset> = {
      type,
      symbol,
      name,
      category,
      ltv: (parseFloat(ltv) / 100).toString(),
      liquidationThreshold: (parseFloat(liquidationThreshold) / 100).toString(),
      liquidityRate: supplyAPY ? (parseFloat(supplyAPY) / 100).toString() : undefined,
      variableBorrowRate: borrowAPY ? (parseFloat(borrowAPY) / 100).toString() : undefined,
      address: address || undefined,
      decimals: decimals ? parseInt(decimals) : undefined,
      notes: notes || undefined,
    };

    if (asset) {
      formData.id = asset.id;
    }

    const result = validate(formData);
    setErrors(result.errors);
    return result.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      const formData = {
        type,
        symbol: symbol.toUpperCase(),
        name,
        category,
        ltv: (parseFloat(ltv) / 100).toString(),
        liquidationThreshold: (parseFloat(liquidationThreshold) / 100).toString(),
        liquidityRate: supplyAPY ? (parseFloat(supplyAPY) / 100).toString() : undefined,
        variableBorrowRate: borrowAPY ? (parseFloat(borrowAPY) / 100).toString() : undefined,
        address: address || undefined,
        decimals: decimals ? parseInt(decimals) : undefined,
        notes: notes || undefined,
      };

      let savedAsset: CustomAsset;
      if (asset) {
        savedAsset = updateAsset(asset.id, formData);
      } else {
        savedAsset = createAsset(formData as any);
      }

      onSave(savedAsset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save asset';
      setErrors([message]);
      setIsSubmitting(false);
    }
  };

  const ltvNum = parseFloat(ltv);
  const liqThresholdNum = parseFloat(liquidationThreshold);
  const isValidThreshold = liqThresholdNum > ltvNum;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-400 mb-2">Errors:</p>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-sm text-red-300">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Type Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Asset Type</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('custom')}
            className={`p-3 rounded-lg border-2 transition-all ${
              type === 'custom'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
            }`}
          >
            <div className="font-semibold text-sm">New Asset</div>
            <div className="text-xs text-slate-400">Create custom crypto</div>
          </button>
          <button
            type="button"
            onClick={() => setType('override')}
            className={`p-3 rounded-lg border-2 transition-all ${
              type === 'override'
                ? 'border-yellow-500 bg-yellow-500/10'
                : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
            }`}
          >
            <div className="font-semibold text-sm">Override Rates</div>
            <div className="text-xs text-slate-400">Custom promotional rates</div>
          </button>
        </div>
      </div>

      {/* 2. Asset Basics */}
      <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200">Asset Information</h3>

        {type === 'override' ? (
          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 block">Asset Symbol *</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
              required
            >
              <option value="">Select an asset to override...</option>
              {liveAssets.map(([sym, meta]) => (
                <option key={sym} value={sym}>
                  {sym} - {meta.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 block">Asset Symbol (2-10 chars) *</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., NEWCOIN"
              maxLength={10}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">Display Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New Awesome Coin"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
          >
            <option value="Stablecoin">Stablecoin</option>
            <option value="Major">Major</option>
            <option value="LSD">Liquid Staking</option>
            <option value="Governance">Governance</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* 3. Interest Rates (Optional) */}
      <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200">Interest Rates (Optional)</h3>
        <p className="text-xs text-slate-400">Leave empty to use defaults (3% supply, 2.5% borrow)</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 block">Supply APY (%)</label>
            <input
              type="number"
              value={supplyAPY}
              onChange={(e) => setSupplyAPY(e.target.value)}
              placeholder="e.g., 8.5"
              step="0.01"
              min="-1000"
              max="1000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-slate-500 mt-1">Negative = incentive/reward</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 block">Borrow APY (%)</label>
            <input
              type="number"
              value={borrowAPY}
              onChange={(e) => setBorrowAPY(e.target.value)}
              placeholder="e.g., 5.2"
              step="0.01"
              min="-1000"
              max="1000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-slate-500 mt-1">Negative = borrowing rewards/incentive</p>
          </div>
        </div>
      </div>

      {/* 4. Risk Parameters (Required) */}
      <div className="space-y-4 bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200">Risk Parameters *</h3>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-300">LTV (Loan-to-Value)</label>
            <span className="text-sm font-bold text-purple-400">{ltvNum.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="90"
            step="1"
            value={ltv}
            onChange={(e) => setLtv(e.target.value)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Conservative (5%)</span>
            <span>Aggressive (90%)</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-300">Liquidation Threshold</label>
            <span className="text-sm font-bold text-purple-400">{liqThresholdNum.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={Math.max(ltvNum + 0.5, 5)}
            max="95"
            step="1"
            value={liquidationThreshold}
            onChange={(e) => setLiquidationThreshold(e.target.value)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-slate-500 mt-1">Must be higher than LTV ({ltvNum.toFixed(0)}%)</p>
          {!isValidThreshold && (
            <p className="text-xs text-red-400 mt-2">⚠️ Liquidation threshold must be higher than LTV</p>
          )}
        </div>
      </div>

      {/* 5. Additional Settings (Optional) */}
      <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200">Additional Settings</h3>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">Contract Address (Optional)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">Format: 0x followed by 40 hex characters</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">Decimals (Optional)</label>
          <input
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            placeholder="18"
            min="0"
            max="18"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Promotional rate valid until January 2025"
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-100 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || errors.length > 0}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Saving...' : asset ? 'Update Asset' : 'Create Asset'}
        </button>
      </div>
    </form>
  );
};
