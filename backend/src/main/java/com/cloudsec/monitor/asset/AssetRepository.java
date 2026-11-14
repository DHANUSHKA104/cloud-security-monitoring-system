package com.cloudsec.monitor.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID>, JpaSpecificationExecutor<Asset> {

    Optional<Asset> findByCode(String code);

    Optional<Asset> findByCodeIgnoreCase(String code);

    Optional<Asset> findByResourceId(String resourceId);

    boolean existsByCode(String code);

    long countByActiveTrue();

    long countByCriticalityAndActiveTrue(Criticality criticality);

    long countByCloudProviderAndActiveTrue(CloudProvider cloudProvider);

    long countByTypeAndActiveTrue(AssetType type);
}
