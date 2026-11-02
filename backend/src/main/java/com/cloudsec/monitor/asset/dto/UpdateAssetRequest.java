package com.cloudsec.monitor.asset.dto;

import com.cloudsec.monitor.asset.AssetStatus;
import com.cloudsec.monitor.asset.AssetType;
import com.cloudsec.monitor.asset.CloudProvider;
import com.cloudsec.monitor.asset.Criticality;
import jakarta.validation.constraints.Size;

public class UpdateAssetRequest {

    @Size(max = 150, message = "Name cannot exceed 150 characters")
    private String name;

    private AssetType type;

    private CloudProvider cloudProvider;

    private Criticality criticality;

    @Size(max = 50, message = "IP address cannot exceed 50 characters")
    private String ipAddress;

    @Size(max = 255, message = "Resource ID cannot exceed 255 characters")
    private String resourceId;

    private AssetStatus status;

    @Size(max = 100, message = "Owner department cannot exceed 100 characters")
    private String ownerDepartment;

    private Boolean active;

    public UpdateAssetRequest() {
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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
