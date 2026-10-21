import { ENV } from '@/config/env';

export const analyticsService = {
  track: (event: string, properties?: Record<string, unknown>): void => {
    if (ENV.IS_DEV) {
      console.log(`[Analytics Event: ${event}]`, properties || {});
    }
    // No external telemetry or tracking in this internal system
  },
};
