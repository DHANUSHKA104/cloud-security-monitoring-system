package com.cloudsec.monitor.asset.dto;

import com.cloudsec.monitor.asset.Asset;
import com.cloudsec.monitor.asset.AssetStatus;
import com.cloudsec.monitor.asset.AssetType;
import com.cloudsec.monitor.asset.CloudProvider;
import com.cloudsec.monitor.asset.Criticality;

import java.time.Instant;
import java.util.UUID;

public class AssetResponse {

    private UUID id;
    private String code;
    private String name;
    private AssetType type;
    private CloudProvider cloudProvider;
    private Criticality criticality;
    private String ipAddress;
    private String resourceId;
    private AssetStatus status;
    private String ownerDepartment;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public AssetResponse() {
    }

    public static AssetResponse fromEntity(Asset asset) {
        if (asset == null) {
            return null;
        }
        AssetResponse resp = new AssetResponse();
        resp.setId(asset.getId());
        resp.setCode(asset.getCode());
        resp.setName(asset.getName());
        resp.setType(asset.getType());
        resp.setCloudProvider(asset.getCloudProvider());
        resp.setCriticality(asset.getCriticality());
        resp.setIpAddress(asset.getIpAddress());
        resp.setResourceId(asset.getResourceId());
        resp.setStatus(asset.getStatus());
        resp.setOwnerDepartment(asset.getOwnerDepartment());
        resp.setActive(asset.isActive());
        resp.setCreatedAt(asset.getCreatedAt());
        resp.setUpdatedAt(asset.getUpdatedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AssetType getType() {
        return type;
    }

    public void setType(AssetType type) {
        this.type = type;
    }

    public CloudProvider getCloudProvider() {
        return cloudProvider;
    }

    public void setCloudProvider(CloudProvider cloudProvider) {
        this.cloudProvider = cloudProvider;
    }

    public Criticality getCriticality() {
        return criticality;
    }

    public void setCriticality(Criticality criticality) {
        this.criticality = criticality;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public String getOwnerDepartment() {
        return ownerDepartment;
    }

    public void setOwnerDepartment(String ownerDepartment) {
        this.ownerDepartment = ownerDepartment;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
