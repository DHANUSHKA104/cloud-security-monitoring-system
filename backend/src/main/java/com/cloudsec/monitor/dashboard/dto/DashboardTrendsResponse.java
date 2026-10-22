package com.cloudsec.monitor.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class DashboardTrendsResponse {

    private List<TrendDataPoint> daily;
    private List<TrendDataPoint> hourly;
    private PriorityBreakdown byPriority;

    public DashboardTrendsResponse() {}

    public DashboardTrendsResponse(List<TrendDataPoint> daily, List<TrendDataPoint> hourly, PriorityBreakdown byPriority) {
        this.daily = daily;
        this.hourly = hourly;
        this.byPriority = byPriority;
    }

    public List<TrendDataPoint> getDaily() {
        return daily;
    }

    public void setDaily(List<TrendDataPoint> daily) {
        this.daily = daily;
    }

    public List<TrendDataPoint> getHourly() {
        return hourly;
    }

    public void setHourly(List<TrendDataPoint> hourly) {
        this.hourly = hourly;
    }

    public PriorityBreakdown getByPriority() {
        return byPriority;
    }

    public void setByPriority(PriorityBreakdown byPriority) {
        this.byPriority = byPriority;
    }

    public static class TrendDataPoint {
        private String timestamp;
        private long count;

        public TrendDataPoint() {}

        public TrendDataPoint(String timestamp, long count) {
            this.timestamp = timestamp;
            this.count = count;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }

    public static class PriorityBreakdown {
        @JsonProperty("P1")
        private long P1;
        @JsonProperty("P2")
        private long P2;
        @JsonProperty("P3")
        private long P3;
        @JsonProperty("P4")
        private long P4;

        public PriorityBreakdown() {}

        public PriorityBreakdown(long p1, long p2, long p3, long p4) {
            this.P1 = p1;
            this.P2 = p2;
            this.P3 = p3;
            this.P4 = p4;
        }

        @JsonProperty("P1")
        public long getP1() {
            return P1;
        }

        @JsonProperty("P1")
        public void setP1(long p1) {
            P1 = p1;
        }

        @JsonProperty("P2")
        public long getP2() {
            return P2;
        }

        @JsonProperty("P2")
        public void setP2(long p2) {
            P2 = p2;
        }

        @JsonProperty("P3")
        public long getP3() {
            return P3;
        }

        @JsonProperty("P3")
        public void setP3(long p3) {
            P3 = p3;
        }

        @JsonProperty("P4")
        public long getP4() {
            return P4;
        }

        @JsonProperty("P4")
        public void setP4(long p4) {
            P4 = p4;
        }
    }
}
