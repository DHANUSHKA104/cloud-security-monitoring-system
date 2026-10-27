
package com.cloudsec.monitor.playbook;

public class PlaybookStep {

    private String title;
    private String description;
    private String status;

    public PlaybookStep() {
    }

    public PlaybookStep(String title, String description) {
        this.title = title;
        this.description = description;
        this.status = "PENDING";
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
