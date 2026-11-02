import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { assetService } from '@/features/assets/services/assetService';
import {
  Asset,
  AssetFilters,
  AssetStats,
  CloudProvider,
  Criticality,
  AssetType,
  AssetStatus,
  CreateAssetPayload,
  UpdateAssetPayload,
} from '@/features/assets/types/asset.types';
import { AssetStatsCards } from '@/features/assets/components/AssetStatsCards';
import { AssetTable } from '@/features/assets/components/AssetTable';
import { AssetDrawer } from '@/features/assets/components/AssetDrawer';
import { AssetFormModal } from '@/features/assets/components/AssetFormModal';
import { Button } from '@/components/ui/Button';

export const Assets: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [cloudProvider, setCloudProvider] = useState<CloudProvider | ''>('');
  const [criticality, setCriticality] = useState<Criticality | ''>('');
  const [type, setType] = useState<AssetType | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals & Drawers
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await assetService.getAssetStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load asset stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const filters: AssetFilters = {
        page,
        size: pageSize,
      };
      if (search.trim()) filters.search = search.trim();
      if (cloudProvider) filters.cloudProvider = cloudProvider;
      if (criticality) filters.criticality = criticality;
      if (type) filters.type = type;

      const res = await assetService.getAssets(filters);
      setAssets(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  }, [search, cloudProvider, criticality, type, page, pageSize]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setDrawerOpen(false);
    setFormOpen(true);
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (
      !window.confirm(
        `Are you sure you want to decommission ${asset.code}? It will be marked inactive and decommissioned.`
      )
    ) {
      return;
    }
    try {
      await assetService.deleteAsset(asset.id);
      setDrawerOpen(false);
      fetchAssets();
      fetchStats();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to decommission asset');
    }
  };

  const handleFormSubmit = async (
    data: CreateAssetPayload | UpdateAssetPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingAsset) {
      await assetService.updateAsset(editingAsset.id, data as UpdateAssetPayload);
    } else {
      await assetService.createAsset(data as CreateAssetPayload);
    }
    fetchAssets();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Cloud Asset Inventory</h1>
          <p className="text-xs text-gray-400 mt-1">
            Centrally discover, classify, and track critical multi-cloud infrastructure linked to security incidents.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={handleOpenCreate} className="shadow-lg shadow-purple-950/50">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Asset
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <AssetStatsCards stats={stats} loading={statsLoading} />

      {/* Filter and Search Bar */}
      <div className="p-4 bg-gray-900/60 rounded-xl border border-purple-900/20 shadow-md flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Search code, name, IP, or resource ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-gray-950 border border-purple-900/40 rounded-lg text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>

        <select
          value={cloudProvider}
          onChange={(e) => {
            setCloudProvider(e.target.value as CloudProvider | '');
            setPage(0);
          }}
          className="px-3 py-2 bg-gray-950 border border-purple-900/40 rounded-lg text-xs text-gray-200"
        >
          <option value="">All Providers</option>
          <option value="AWS">AWS</option>
          <option value="GCP">GCP</option>
          <option value="AZURE">Azure</option>
          <option value="ON_PREMISE">On-Premise</option>
        </select>

        <select
          value={criticality}
          onChange={(e) => {
            setCriticality(e.target.value as Criticality | '');
            setPage(0);
          }}
          className="px-3 py-2 bg-gray-950 border border-purple-900/40 rounded-lg text-xs text-gray-200"
        >
          <option value="">All Criticalities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as AssetType | '');
            setPage(0);
          }}
          className="px-3 py-2 bg-gray-950 border border-purple-900/40 rounded-lg text-xs text-gray-200"
        >
          <option value="">All Types</option>
          <option value="STORAGE_BUCKET">Storage Bucket</option>
          <option value="VIRTUAL_MACHINE">Virtual Machine</option>
          <option value="DATABASE_INSTANCE">Database Instance</option>
          <option value="API_GATEWAY">API Gateway</option>
          <option value="KUBERNETES_CLUSTER">Kubernetes Cluster</option>
          <option value="IAM_ROLE">IAM Role</option>
        </select>

        {(search || cloudProvider || criticality || type) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCloudProvider('');
              setCriticality('');
              setType('');
              setPage(0);
            }}
            className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Asset Table */}
      <AssetTable
        assets={assets}
        loading={loading}
        onSelectAsset={handleSelectAsset}
        onEditAsset={handleEditAsset}
        onDeleteAsset={handleDeleteAsset}
        isAdmin={isAdmin}
        totalElements={totalElements}
        page={page}
        size={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Details Drawer */}
      <AssetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        asset={selectedAsset}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        isAdmin={isAdmin}
      />

      {/* Create / Edit Form Modal */}
      <AssetFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        asset={editingAsset}
      />
    </div>
  );
};

export default Assets;
