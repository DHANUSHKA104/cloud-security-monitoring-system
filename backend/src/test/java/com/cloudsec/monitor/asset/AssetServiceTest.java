package com.cloudsec.monitor.asset;

import com.cloudsec.monitor.asset.dto.AssetResponse;
import com.cloudsec.monitor.asset.dto.AssetStatsResponse;
import com.cloudsec.monitor.asset.dto.CreateAssetRequest;
import com.cloudsec.monitor.asset.dto.UpdateAssetRequest;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private AssetService assetService;

    private Asset sampleAsset;

    @BeforeEach
    void setUp() {
        sampleAsset = new Asset(
                "AST-AWS-S3-01",
                "Production Data Lake",
                AssetType.STORAGE_BUCKET,
                CloudProvider.AWS,
                Criticality.CRITICAL,
                null,
                "arn:aws:s3:::prod-customer-data-vault",
                AssetStatus.ACTIVE,
                "Data Platform"
        );
        sampleAsset.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("createAsset - Successfully saves new asset when code is unique")
    void createAsset_success() {
        CreateAssetRequest req = new CreateAssetRequest(
                "AST-AWS-S3-01",
                "Production Data Lake",
                AssetType.STORAGE_BUCKET,
                CloudProvider.AWS,
                Criticality.CRITICAL,
                null,
                "arn:aws:s3:::prod-customer-data-vault",
                AssetStatus.ACTIVE,
                "Data Platform"
        );

        when(assetRepository.existsByCode("AST-AWS-S3-01")).thenReturn(false);
        when(assetRepository.save(any(Asset.class))).thenReturn(sampleAsset);

        AssetResponse res = assetService.createAsset(req);

        assertThat(res).isNotNull();
        assertThat(res.getCode()).isEqualTo("AST-AWS-S3-01");
        assertThat(res.getType()).isEqualTo(AssetType.STORAGE_BUCKET);
        assertThat(res.getCloudProvider()).isEqualTo(CloudProvider.AWS);
        assertThat(res.getCriticality()).isEqualTo(Criticality.CRITICAL);
        verify(assetRepository).save(any(Asset.class));
    }

    @Test
    @DisplayName("createAsset - Throws CONFLICT when code already exists")
    void createAsset_duplicateCode_throwsConflict() {
        CreateAssetRequest req = new CreateAssetRequest(
                "AST-AWS-S3-01",
                "Production Data Lake",
                AssetType.STORAGE_BUCKET,
                CloudProvider.AWS,
                Criticality.CRITICAL,
                null,
                null,
                AssetStatus.ACTIVE,
                null
        );

        when(assetRepository.existsByCode("AST-AWS-S3-01")).thenReturn(true);

        assertThatThrownBy(() -> assetService.createAsset(req))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONFLICT);

        verify(assetRepository, never()).save(any());
    }

    @Test
    @DisplayName("getAssetById - Returns asset when found")
    void getAssetById_found() {
        UUID id = sampleAsset.getId();
        when(assetRepository.findById(id)).thenReturn(Optional.of(sampleAsset));

        AssetResponse res = assetService.getAssetById(id);

        assertThat(res).isNotNull();
        assertThat(res.getId()).isEqualTo(id);
        assertThat(res.getCode()).isEqualTo("AST-AWS-S3-01");
    }

    @Test
    @DisplayName("getAssetById - Throws NOT_FOUND when asset does not exist")
    void getAssetById_notFound_throwsNotFound() {
        UUID id = UUID.randomUUID();
        when(assetRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> assetService.getAssetById(id))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("getAssetByCode - Finds asset by code or resourceId")
    void getAssetByCode_findsAsset() {
        when(assetRepository.findByCode("arn:aws:s3:::prod-customer-data-vault")).thenReturn(Optional.empty());
        when(assetRepository.findByCodeIgnoreCase("arn:aws:s3:::prod-customer-data-vault")).thenReturn(Optional.empty());
        when(assetRepository.findByResourceId("arn:aws:s3:::prod-customer-data-vault")).thenReturn(Optional.of(sampleAsset));

        AssetResponse res = assetService.getAssetByCode("arn:aws:s3:::prod-customer-data-vault");

        assertThat(res).isNotNull();
        assertThat(res.getCode()).isEqualTo("AST-AWS-S3-01");
    }

    @Test
    @DisplayName("updateAsset - Updates asset fields successfully")
    void updateAsset_success() {
        UUID id = sampleAsset.getId();
        UpdateAssetRequest req = new UpdateAssetRequest();
        req.setName("Updated Lake Name");
        req.setCriticality(Criticality.HIGH);

        when(assetRepository.findById(id)).thenReturn(Optional.of(sampleAsset));
        when(assetRepository.save(any(Asset.class))).thenAnswer(inv -> inv.getArgument(0));

        AssetResponse res = assetService.updateAsset(id, req);

        assertThat(res).isNotNull();
        assertThat(res.getName()).isEqualTo("Updated Lake Name");
        assertThat(res.getCriticality()).isEqualTo(Criticality.HIGH);
    }

    @Test
    @DisplayName("deleteAsset - Soft-deletes asset and sets status to DECOMMISSIONED")
    void deleteAsset_softDeletes() {
        UUID id = sampleAsset.getId();
        when(assetRepository.findById(id)).thenReturn(Optional.of(sampleAsset));
        when(assetRepository.save(any(Asset.class))).thenAnswer(inv -> inv.getArgument(0));

        assetService.deleteAsset(id);

        assertThat(sampleAsset.isActive()).isFalse();
        assertThat(sampleAsset.getStatus()).isEqualTo(AssetStatus.DECOMMISSIONED);
        verify(assetRepository).save(sampleAsset);
    }

    @Test
    @DisplayName("getAssetStats - Gathers counts for provider, criticality and types")
    void getAssetStats_returnsExpectedStats() {
        when(assetRepository.count()).thenReturn(10L);
        when(assetRepository.countByActiveTrue()).thenReturn(8L);
        when(assetRepository.countByCriticalityAndActiveTrue(Criticality.CRITICAL)).thenReturn(3L);
        when(assetRepository.countByCloudProviderAndActiveTrue(CloudProvider.AWS)).thenReturn(5L);

        AssetStatsResponse stats = assetService.getAssetStats();

        assertThat(stats.getTotalAssets()).isEqualTo(10L);
        assertThat(stats.getActiveAssets()).isEqualTo(8L);
        assertThat(stats.getCriticalAssets()).isEqualTo(3L);
        assertThat(stats.getByCloudProvider()).containsEntry("AWS", 5L);
    }
}
