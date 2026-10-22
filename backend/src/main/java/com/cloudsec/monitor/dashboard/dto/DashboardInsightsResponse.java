package com.cloudsec.monitor.dashboard.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardInsightsResponse {

    private boolean available;
    private List<VolumeAnomaly> volumeAnomalies = new ArrayList<>();
    private List<CoverageGap> coverageGaps = new ArrayList<>();
    private List<ResolutionStat> resolutionStats = new ArrayList<>();

    public DashboardInsightsResponse() {}

    public DashboardInsightsResponse(
            boolean available,
            List<VolumeAnomaly> volumeAnomalies,
            List<CoverageGap> coverageGaps,
            List<ResolutionStat> resolutionStats
    ) {
        this.available = available;
        this.volumeAnomalies = volumeAnomalies != null ? volumeAnomalies : new ArrayList<>();
        this.coverageGaps = coverageGaps != null ? coverageGaps : new ArrayList<>();
        this.resolutionStats = resolutionStats != null ? resolutionStats : new ArrayList<>();
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public List<VolumeAnomaly> getVolumeAnomalies() {
        return volumeAnomalies;
    }

    public void setVolumeAnomalies(List<VolumeAnomaly> volumeAnomalies) {
        this.volumeAnomalies = volumeAnomalies;
    }

    public List<CoverageGap> getCoverageGaps() {
        return coverageGaps;
    }

    public void setCoverageGaps(List<CoverageGap> coverageGaps) {
        this.coverageGaps = coverageGaps;
    }

    public List<ResolutionStat> getResolutionStats() {
        return resolutionStats;
    }

    public void setResolutionStats(List<ResolutionStat> resolutionStats) {
        this.resolutionStats = resolutionStats;
    }

    public static class VolumeAnomaly {
        private String windowStart;
        private long count;
        private double baseline;
        private double zScore;

        public VolumeAnomaly() {}

        public VolumeAnomaly(String windowStart, long count, double baseline, double zScore) {
            this.windowStart = windowStart;
            this.count = count;
            this.baseline = baseline;
            this.zScore = zScore;
        }

        public String getWindowStart() {
            return windowStart;
        }

        public void setWindowStart(String windowStart) {
            this.windowStart = windowStart;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }

        public double getBaseline() {
            return baseline;
        }

        public void setBaseline(double baseline) {
            this.baseline = baseline;
        }

        public double getzScore() {
            return zScore;
        }

        public void setzScore(double zScore) {
            this.zScore = zScore;
        }
    }

    public static class CoverageGap {
        private String dayOfWeek;
        private int hour;
        private double expectedLoad;
        private int analystsScheduled;

        public CoverageGap() {}

        public CoverageGap(String dayOfWeek, int hour, double expectedLoad, int analystsScheduled) {
            this.dayOfWeek = dayOfWeek;
            this.hour = hour;
            this.expectedLoad = expectedLoad;
            this.analystsScheduled = analystsScheduled;
        }

        public String getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public int getHour() {
            return hour;
        }

        public void setHour(int hour) {
            this.hour = hour;
        }

        public double getExpectedLoad() {
            return expectedLoad;
        }

        public void setExpectedLoad(double expectedLoad) {
            this.expectedLoad = expectedLoad;
        }

        public int getAnalystsScheduled() {
            return analystsScheduled;
        }

        public void setAnalystsScheduled(int analystsScheduled) {
            this.analystsScheduled = analystsScheduled;
        }
    }

    public static class ResolutionStat {
        private String category;
        private String priority;
        private double medianMinutes;
        private double p90Minutes;
        private long samples;

        public ResolutionStat() {}

        public ResolutionStat(String category, String priority, double medianMinutes, double p90Minutes, long samples) {
            this.category = category;
            this.priority = priority;
            this.medianMinutes = medianMinutes;
            this.p90Minutes = p90Minutes;
            this.samples = samples;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public double getMedianMinutes() {
            return medianMinutes;
        }

        public void setMedianMinutes(double medianMinutes) {
            this.medianMinutes = medianMinutes;
        }

        public double getP90Minutes() {
            return p90Minutes;
        }

        public void setP90Minutes(double p90Minutes) {
            this.p90Minutes = p90Minutes;
        }

        public long getSamples() {
            return samples;
        }

        public void setSamples(long samples) {
            this.samples = samples;
        }
    }
}
