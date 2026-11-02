package com.cloudsec.monitor.asset;

import com.cloudsec.monitor.asset.dto.AssetResponse;
import com.cloudsec.monitor.asset.dto.AssetStatsResponse;
import com.cloudsec.monitor.asset.dto.CreateAssetRequest;
import com.cloudsec.monitor.asset.dto.UpdateAssetRequest;
import com.cloudsec.monitor.common.exception.ApiException;
import com.cloudsec.monitor.common.exception.ErrorCode;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AssetService {

    private static final Logger log = LoggerFactory.getLogger(AssetService.class);

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public Page<AssetResponse> getAssets(
            String search,
            AssetType type,
            CloudProvider cloudProvider,
            Criticality criticality,
            AssetStatus status,
            Boolean active,
            Pageable pageable
    ) {
        Specification<Asset> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), term);
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), term);
                Predicate ipMatch = cb.like(cb.lower(root.get("ipAddress")), term);
                Predicate resMatch = cb.like(cb.lower(root.get("resourceId")), term);
                predicates.add(cb.or(codeMatch, nameMatch, ipMatch, resMatch));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            if (cloudProvider != null) {
                predicates.add(cb.equal(root.get("cloudProvider"), cloudProvider));
            }

            if (criticality != null) {
                predicates.add(cb.equal(root.get("criticality"), criticality));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return assetRepository.findAll(spec, pageable).map(AssetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AssetResponse getAssetById(UUID id) {
        return assetRepository.findById(id)
                .map(AssetResponse::fromEntity)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Asset not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public AssetResponse getAssetByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Asset code must be provided");
        }
        String trimmed = code.trim();
        return assetRepository.findByCode(trimmed)
                .or(() -> assetRepository.findByCodeIgnoreCase(trimmed))
                .or(() -> assetRepository.findByResourceId(trimmed))
                .map(AssetResponse::fromEntity)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Asset not found with code or resource ID: " + trimmed));
    }

    @Transactional
    public AssetResponse createAsset(CreateAssetRequest request) {
        String code = request.getCode().trim();
        if (assetRepository.existsByCode(code)) {
            throw new ApiException(ErrorCode.CONFLICT, "Asset with code already exists: " + code);
        }

        Asset asset = new Asset(
                code,
                request.getName().trim(),
                request.getType(),
                request.getCloudProvider(),
                request.getCriticality(),
                request.getIpAddress() != null ? request.getIpAddress().trim() : null,
                request.getResourceId() != null ? request.getResourceId().trim() : null,
                request.getStatus() != null ? request.getStatus() : AssetStatus.ACTIVE,
                request.getOwnerDepartment() != null ? request.getOwnerDepartment().trim() : null
        );

        Asset saved = assetRepository.save(asset);
        log.info("Asset created: {} ({})", saved.getCode(), saved.getName());
        return AssetResponse.fromEntity(saved);
    }

    @Transactional
    public AssetResponse updateAsset(UUID id, UpdateAssetRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Asset not found with ID: " + id));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            asset.setName(request.getName().trim());
        }
        if (request.getType() != null) {
            asset.setType(request.getType());
        }
        if (request.getCloudProvider() != null) {
            asset.setCloudProvider(request.getCloudProvider());
        }
        if (request.getCriticality() != null) {
            asset.setCriticality(request.getCriticality());
        }
        if (request.getIpAddress() != null) {
            asset.setIpAddress(request.getIpAddress().trim().isEmpty() ? null : request.getIpAddress().trim());
        }
        if (request.getResourceId() != null) {
            asset.setResourceId(request.getResourceId().trim().isEmpty() ? null : request.getResourceId().trim());
        }
        if (request.getStatus() != null) {
            asset.setStatus(request.getStatus());
        }
        if (request.getOwnerDepartment() != null) {
            asset.setOwnerDepartment(request.getOwnerDepartment().trim().isEmpty() ? null : request.getOwnerDepartment().trim());
        }
        if (request.getActive() != null) {
            asset.setActive(request.getActive());
            if (!request.getActive()) {
                asset.setStatus(AssetStatus.DECOMMISSIONED);
            }
        }

        Asset updated = assetRepository.save(asset);
        log.info("Asset updated: {}", updated.getCode());
        return AssetResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteAsset(UUID id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Asset not found with ID: " + id));

        asset.setActive(false);
        asset.setStatus(AssetStatus.DECOMMISSIONED);
        assetRepository.save(asset);
        log.info("Asset soft-deleted (decommissioned): {}", asset.getCode());
    }

    @Transactional(readOnly = true)
    public AssetStatsResponse getAssetStats() {
        long total = assetRepository.count();
        long active = assetRepository.countByActiveTrue();
        long critical = assetRepository.countByCriticalityAndActiveTrue(Criticality.CRITICAL);

        Map<String, Long> byProvider = new LinkedHashMap<>();
        for (CloudProvider provider : CloudProvider.values()) {
            long count = assetRepository.countByCloudProviderAndActiveTrue(provider);
            if (count > 0) {
                byProvider.put(provider.name(), count);
            }
        }

        Map<String, Long> byCrit = new LinkedHashMap<>();
        for (Criticality crit : Criticality.values()) {
            long count = assetRepository.countByCriticalityAndActiveTrue(crit);
            byCrit.put(crit.name(), count);
        }

        Map<String, Long> byType = new LinkedHashMap<>();
        for (AssetType t : AssetType.values()) {
            long count = assetRepository.countByTypeAndActiveTrue(t);
            if (count > 0) {
                byType.put(t.name(), count);
            }
        }

        return new AssetStatsResponse(total, active, critical, byProvider, byCrit, byType);
    }
}
