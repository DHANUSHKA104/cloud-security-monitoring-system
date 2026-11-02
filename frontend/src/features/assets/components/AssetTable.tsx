import React from 'react';
import { Asset } from '../types/asset.types';
import { Button } from '@/components/ui/Button';

interface AssetTableProps {
  assets: Asset[];
  loading: boolean;
  onSelectAsset: (asset: Asset) => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (asset: Asset) => void;
  isAdmin: boolean;
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  loading,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  isAdmin,
  totalElements,
  page,
  size,
  totalPages,
  onPageChange,
}) => {
  const getCriticalityBadge = (crit: string) => {
    switch (crit) {
      case 'CRITICAL':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'AWS':
        return 'bg-amber-950/50 text-amber-300 border-amber-600/30';
      case 'GCP':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-600/30';
      case 'AZURE':
        return 'bg-blue-950/50 text-blue-300 border-blue-600/30';
      case 'ON_PREMISE':
        return 'bg-purple-950/50 text-purple-300 border-purple-600/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/60 rounded-xl border border-purple-900/20 p-8 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
        Loading asset inventory...
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-gray-900/60 rounded-xl border border-purple-900/20 p-12 text-center text-gray-400">
        <svg
          className="w-12 h-12 text-purple-400/40 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="text-base font-semibold text-gray-200">No assets found</p>
        <p className="text-xs text-gray-500 mt-1">Try adjusting your search criteria or register a new asset.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 rounded-xl border border-purple-900/20 overflow-hidden shadow-xl shadow-black/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#0e0c1a] border-b border-purple-900/20 text-gray-400 font-medium">
            <tr>
              <th className="py-3 px-4">Code / Resource</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Cloud Provider</th>
              <th className="py-3 px-4">Criticality</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-900/10">
            {assets.map((asset) => (
              <tr
                key={asset.id}
                className="hover:bg-purple-950/20 transition-colors group cursor-pointer"
                onClick={() => onSelectAsset(asset)}
              >
                <td className="py-3 px-4">
                  <div className="font-mono font-semibold text-purple-300 group-hover:text-purple-200">
                    {asset.code}
                  </div>
                  {asset.ipAddress && (
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{asset.ipAddress}</div>
                  )}
                </td>
                <td className="py-3 px-4 font-medium text-gray-100 max-w-[200px] truncate">
                  {asset.name}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[11px]">
                    {asset.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getProviderBadge(
                      asset.cloudProvider
                    )}`}
                  >
                    {asset.cloudProvider}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getCriticalityBadge(
                      asset.criticality
                    )}`}
                  >
                    {asset.criticality}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      asset.active && asset.status === 'ACTIVE'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        asset.active && asset.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    {asset.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">{asset.ownerDepartment || '—'}</td>
                <td className="py-3 px-4 text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectAsset(asset)}
                      className="p-1 text-gray-400 hover:text-purple-300 hover:bg-purple-900/30 rounded"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditAsset(asset)}
                          className="p-1 text-gray-400 hover:text-amber-300 hover:bg-amber-900/30 rounded"
                          title="Edit Asset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {asset.active && (
                          <button
                            type="button"
                            onClick={() => onDeleteAsset(asset)}
                            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-900/30 rounded"
                            title="Decommission Asset"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0e0c1a] border-t border-purple-900/20 text-xs text-gray-400">
        <div>
          Showing {assets.length > 0 ? page * size + 1 : 0} to{' '}
          {Math.min((page + 1) * size, totalElements)} of {totalElements} assets
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="px-2">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
