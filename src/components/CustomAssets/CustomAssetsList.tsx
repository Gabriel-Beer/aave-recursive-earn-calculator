'use client';

import React from 'react';
import { CustomAsset } from '@/types/customAssets';
import { useCustomAssets } from '@/hooks/useCustomAssets';

interface Props {
  assets: CustomAsset[];
  onEdit: (asset: CustomAsset) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const CustomAssetsList: React.FC<Props> = ({ assets, onEdit, onAdd, onDelete }) => {
  const { removeAsset } = useCustomAssets();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const handleDelete = (id: string) => {
    try {
      removeAsset(id);
      onDelete(id);
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
    setIsDeleting(null);
  };

  if (assets.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No Custom Assets Yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Create your first custom asset or override promotional rates for existing ones
          </p>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg font-medium transition-colors"
          >
            + Create Custom Asset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">{assets.length} custom asset{assets.length !== 1 ? 's' : ''}</p>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Add New
        </button>
      </div>

      <div className="space-y-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header with symbol and type badge */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-slate-100">{asset.symbol}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      asset.type === 'override'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    {asset.type === 'override' ? 'Override' : 'Custom'}
                  </span>
                </div>

                {/* Name and category */}
                <p className="text-sm text-slate-400 mb-3">{asset.name}</p>

                {/* Rates and parameters grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-xs text-slate-500 block">Supply APY</span>
                    <div className="text-sm font-bold text-green-400">
                      {asset.liquidityRate ? (parseFloat(asset.liquidityRate) * 100).toFixed(2) : '3.00'}%
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-xs text-slate-500 block">Borrow APY</span>
                    <div className="text-sm font-bold text-red-400">
                      {asset.variableBorrowRate ? (parseFloat(asset.variableBorrowRate) * 100).toFixed(2) : '2.50'}%
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded p-2">
                    <span className="text-xs text-slate-500 block">LTV</span>
                    <div className="text-sm font-bold text-purple-400">
                      {(parseFloat(asset.ltv) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {asset.notes && (
                  <p className="text-xs text-slate-500 italic">📝 {asset.notes}</p>
                )}

                {/* Category and creation date */}
                <div className="flex gap-4 text-xs text-slate-600 mt-3">
                  <span>{asset.category || 'Other'}</span>
                  <span>Created {new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onEdit(asset)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-slate-100"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setIsDeleting(asset.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-300 hover:text-red-300"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Delete confirmation dialog */}
            {isDeleting === asset.id && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300 mb-2">Delete this asset? This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="flex-1 px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setIsDeleting(null)}
                    className="flex-1 px-2 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
