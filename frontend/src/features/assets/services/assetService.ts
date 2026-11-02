import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { PageResponse } from '@/types';
import {
  Asset,
  AssetFilters,
  AssetStats,
  CreateAssetPayload,
  UpdateAssetPayload,
} from '../types/asset.types';

export const assetService = {
  getAssets: (filters?: AssetFilters) =>
    apiClient.get<PageResponse<Asset>>(API_ENDPOINTS.ASSETS.BASE, {
      params: filters,
    }),

  getAssetById: (id: string) =>
    apiClient.get<Asset>(API_ENDPOINTS.ASSETS.BY_ID(id)),

  getAssetByCode: (code: string) =>
    apiClient.get<Asset>(API_ENDPOINTS.ASSETS.BY_CODE(code)),

  getAssetStats: () =>
    apiClient.get<AssetStats>(API_ENDPOINTS.ASSETS.STATS),

  createAsset: (data: CreateAssetPayload) =>
    apiClient.post<Asset>(API_ENDPOINTS.ASSETS.BASE, data),

  updateAsset: (id: string, data: UpdateAssetPayload) =>
    apiClient.patch<Asset>(API_ENDPOINTS.ASSETS.BY_ID(id), data),

  deleteAsset: (id: string) =>
    apiClient.delete<void>(API_ENDPOINTS.ASSETS.BY_ID(id)),
};
