import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Asset } from '../types/asset.types';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.constants';

interface AssetDrawerProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  isAdmin: boolean;
}

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
  open,
  onClose,
  asset,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  if (!asset) return null;

  const getCriticalityBadge = (crit: string) => {
    switch (crit) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getProviderBadge = (p: string) => {
    switch (p) {
      case 'AWS':
        return 'bg-amber-950/60 text-amber-200 border-amber-600/30';
      case 'GCP':
        return 'bg-emerald-950/60 text-emerald-200 border-emerald-600/30';
      case 'AZURE':
        return 'bg-blue-950/60 text-blue-200 border-blue-600/30';
      case 'ON_PREMISE':
        return 'bg-purple-950/60 text-purple-200 border-purple-600/30';
      default:
        return 'bg-gray-900 text-gray-300 border-gray-700';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Asset Details: ${asset.code}`} maxWidth="lg">
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-900/60 rounded-xl border border-purple-900/20">
          <div>
            <h3 className="text-lg font-bold text-gray-100">{asset.name}</h3>
            <p className="text-xs font-mono text-purple-300 mt-0.5">{asset.code}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getCriticalityBadge(
                asset.criticality
              )}`}
            >
              {asset.criticality}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getProviderBadge(
                asset.cloudProvider
              )}`}
            >
              {asset.cloudProvider}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                asset.active && asset.status === 'ACTIVE'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/70 text-rose-300 border border-rose-500/30'
              }`}
            >
              {asset.status}
            </span>
          </div>
        </div>

        {/* Technical specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-gray-900/40 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 block mb-1">Asset Type</span>
            <span className="text-sm font-medium text-gray-200">
              {asset.type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-3.5 bg-gray-900/40 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 block mb-1">Owner Department</span>
            <span className="text-sm font-medium text-gray-200">
              {asset.ownerDepartment || 'Unassigned'}
            </span>
          </div>

          <div className="p-3.5 bg-gray-900/40 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 block mb-1">IP Address</span>
            <span className="text-sm font-mono text-cyan-300">
              {asset.ipAddress || 'None (Cloud Native)'}
            </span>
          </div>

          <div className="p-3.5 bg-gray-900/40 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400 block mb-1">First Registered</span>
            <span className="text-sm text-gray-300">
              {new Date(asset.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Cloud Resource Identifier */}
        <div className="p-4 bg-gray-900/40 rounded-lg border border-gray-800">
          <span className="text-xs text-gray-400 block mb-1">Resource ID / Cloud ARN</span>
          <span className="text-xs font-mono text-gray-200 break-all select-all block bg-gray-950 p-2.5 rounded border border-gray-800">
            {asset.resourceId || 'N/A'}
          </span>
        </div>

        {/* Incident Cross-reference */}
        <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-900/30 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-purple-200">Security Incidents</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Filter active and past incidents linked to asset code or resource ID
            </p>
          </div>
          <Link
            to={`${ROUTES.INCIDENTS}?q=${encodeURIComponent(asset.code)}`}
            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold rounded-lg border border-purple-500/40 transition-colors"
          >
            View Linked Incidents &rarr;
          </Link>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-purple-900/20">
          {isAdmin && asset.active && onDelete ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => onDelete(asset)}
            >
              Decommission Asset
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            {isAdmin && onEdit && (
              <Button type="button" variant="secondary" onClick={() => onEdit(asset)}>
                Edit Asset
              </Button>
            )}
            <Button type="button" variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
