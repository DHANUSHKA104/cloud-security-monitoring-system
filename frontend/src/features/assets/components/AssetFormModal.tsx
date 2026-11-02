import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Asset,
  AssetType,
  CloudProvider,
  Criticality,
  AssetStatus,
  CreateAssetPayload,
  UpdateAssetPayload,
} from '../types/asset.types';

interface AssetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssetPayload | UpdateAssetPayload, isEdit: boolean) => Promise<void>;
  asset?: Asset | null;
}

const ASSET_TYPES: AssetType[] = [
  'VIRTUAL_MACHINE',
  'CONTAINER',
  'DATABASE_INSTANCE',
  'STORAGE_BUCKET',
  'IAM_ROLE',
  'API_GATEWAY',
  'KUBERNETES_CLUSTER',
  'SERVERLESS_FUNCTION',
  'NETWORK_FIREWALL',
  'OTHER',
];

const CLOUD_PROVIDERS: CloudProvider[] = [
  'AWS',
  'GCP',
  'AZURE',
  'ON_PREMISE',
  'MULTI_CLOUD',
  'OTHER',
];

const CRITICALITIES: Criticality[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const STATUSES: AssetStatus[] = ['ACTIVE', 'INACTIVE', 'DECOMMISSIONED', 'MAINTENANCE'];

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  asset,
}) => {
  const isEdit = Boolean(asset);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('VIRTUAL_MACHINE');
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>('AWS');
  const [criticality, setCriticality] = useState<Criticality>('HIGH');
  const [ipAddress, setIpAddress] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [status, setStatus] = useState<AssetStatus>('ACTIVE');
  const [ownerDepartment, setOwnerDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setCode(asset.code || '');
      setName(asset.name || '');
      setType(asset.type || 'VIRTUAL_MACHINE');
      setCloudProvider(asset.cloudProvider || 'AWS');
      setCriticality(asset.criticality || 'HIGH');
      setIpAddress(asset.ipAddress || '');
      setResourceId(asset.resourceId || '');
      setStatus(asset.status || 'ACTIVE');
      setOwnerDepartment(asset.ownerDepartment || '');
    } else {
      setCode('');
      setName('');
      setType('VIRTUAL_MACHINE');
      setCloudProvider('AWS');
      setCriticality('HIGH');
      setIpAddress('');
      setResourceId('');
      setStatus('ACTIVE');
      setOwnerDepartment('');
    }
    setError(null);
  }, [asset, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Asset name is required');
      return;
    }
    if (!isEdit && !code.trim()) {
      setError('Asset code is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        const payload: UpdateAssetPayload = {
          name: name.trim(),
          type,
          cloudProvider,
          criticality,
          ipAddress: ipAddress.trim() || undefined,
          resourceId: resourceId.trim() || undefined,
          status,
          ownerDepartment: ownerDepartment.trim() || undefined,
        };
        await onSubmit(payload, true);
      } else {
        const payload: CreateAssetPayload = {
          code: code.trim(),
          name: name.trim(),
          type,
          cloudProvider,
          criticality,
          ipAddress: ipAddress.trim() || undefined,
          resourceId: resourceId.trim() || undefined,
          status,
          ownerDepartment: ownerDepartment.trim() || undefined,
        };
        await onSubmit(payload, false);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Asset: ${asset?.code}` : 'Register New Asset'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Asset Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              placeholder="e.g. AST-AWS-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100 disabled:opacity-50 disabled:bg-gray-950 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Asset Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Production Data Vault"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Asset Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Cloud Provider</label>
            <select
              value={cloudProvider}
              onChange={(e) => setCloudProvider(e.target.value as CloudProvider)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100"
            >
              {CLOUD_PROVIDERS.map((cp) => (
                <option key={cp} value={cp}>
                  {cp.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as Criticality)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100"
            >
              {CRITICALITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssetStatus)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">IP Address</label>
            <input
              type="text"
              placeholder="e.g. 10.0.1.25"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Owner Department</label>
            <input
              type="text"
              placeholder="e.g. Infrastructure, SecOps"
              value={ownerDepartment}
              onChange={(e) => setOwnerDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Resource ID / Cloud ARN</label>
          <input
            type="text"
            placeholder="e.g. arn:aws:s3:::bucket-name or subscription-id/rg/..."
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-purple-900/40 rounded-lg text-sm text-gray-100 font-mono"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-purple-900/20">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Asset' : 'Register Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
