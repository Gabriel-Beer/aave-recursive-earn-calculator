'use client';

import React, { useState, useCallback } from 'react';
import { CustomAsset } from '@/types/customAssets';
import { useCustomAssets } from '@/hooks/useCustomAssets';
import { CustomAssetForm } from './CustomAssetForm';
import { CustomAssetsList } from './CustomAssetsList';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'list' | 'form';

export const CustomAssetsDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { assets } = useCustomAssets();
  const [view, setView] = useState<View>('list');
  const [selectedAsset, setSelectedAsset] = useState<CustomAsset | null>(null);

  const handleAddNew = useCallback(() => {
    setSelectedAsset(null);
    setView('form');
  }, []);

  const handleEdit = useCallback((asset: CustomAsset) => {
    setSelectedAsset(asset);
    setView('form');
  }, []);

  const handleFormSave = useCallback((asset: CustomAsset) => {
    setView('list');
    setSelectedAsset(null);
  }, []);

  const handleFormCancel = useCallback(() => {
    setView('list');
    setSelectedAsset(null);
  }, []);

  const handleDelete = useCallback(() => {
    setView('list');
    setSelectedAsset(null);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Custom Assets
            </h2>
            {view === 'list' && assets.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">{assets.length} asset{assets.length !== 1 ? 's' : ''} saved</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {view === 'list' ? (
            <CustomAssetsList
              assets={assets}
              onEdit={handleEdit}
              onAdd={handleAddNew}
              onDelete={handleDelete}
            />
          ) : (
            <CustomAssetForm
              asset={selectedAsset}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
          )}
        </div>
      </div>
    </>
  );
};
