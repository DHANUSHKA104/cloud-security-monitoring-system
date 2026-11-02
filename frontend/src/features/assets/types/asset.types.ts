export type AssetType =
  | 'VIRTUAL_MACHINE'
  | 'CONTAINER'
  | 'DATABASE_INSTANCE'
  | 'STORAGE_BUCKET'
  | 'IAM_ROLE'
  | 'API_GATEWAY'
  | 'KUBERNETES_CLUSTER'
  | 'SERVERLESS_FUNCTION'
  | 'NETWORK_FIREWALL'
  | 'OTHER';

export type CloudProvider = 'AWS' | 'GCP' | 'AZURE' | 'ON_PREMISE' | 'MULTI_CLOUD' | 'OTHER';

export type Criticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AssetStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED' | 'MAINTENANCE';

export interface Asset {
  id: string;
  code: string;
  name: string;
  type: AssetType;
  cloudProvider: CloudProvider;
  criticality: Criticality;
  ipAddress?: string;
  resourceId?: string;
  status: AssetStatus;
  ownerDepartment?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetStats {
  totalAssets: number;
  activeAssets: number;
  criticalAssets: number;
  byCloudProvider: Record<string, number>;
  byCriticality: Record<string, number>;
  byType: Record<string, number>;
}

export interface AssetFilters {
  search?: string;
  type?: AssetType;
  cloudProvider?: CloudProvider;
  criticality?: Criticality;
  status?: AssetStatus;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateAssetPayload {
  code: string;
  name: string;
  type: AssetType;
  cloudProvider: CloudProvider;
  criticality: Criticality;
  ipAddress?: string;
  resourceId?: string;
  status?: AssetStatus;
  ownerDepartment?: string;
}

export interface UpdateAssetPayload {
  name?: string;
  type?: AssetType;
  cloudProvider?: CloudProvider;
  criticality?: Criticality;
  ipAddress?: string;
  resourceId?: string;
  status?: AssetStatus;
  ownerDepartment?: string;
  active?: boolean;
}
