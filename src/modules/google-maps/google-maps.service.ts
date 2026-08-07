import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);

  /**
   * Retrieves address autocomplete suggestions from Google Places API (New).
   */
  async getAddressSuggestions(input: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GOOGLE_MAPS_API_KEY is not defined in the environment. Returning mock suggestions.',
      );
      return {
        suggestions: [
          {
            placePrediction: {
              placeId: 'ChIJgUb48uq-vzsR...',
              text: { text: `[DEMO] Mumbai Municipal Corporation, Fort, Mumbai (No API key set)` },
            },
          },
          {
            placePrediction: {
              placeId: 'ChIJgUb48uq-vzsR2...',
              text: { text: `[DEMO] Pune Municipal Office, Shivajinagar, Pune (No API key set)` },
            },
          },
        ],
      };
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1',
        },
        body: JSON.stringify({
          input,
          regionCode: 'IN', // Default filter to India
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Google Places API error: ${JSON.stringify(errorData)}`);
        throw new Error(`Google Places API returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to fetch address suggestions from Google Places API', error);
      throw new Error('Failed to retrieve address suggestions');
    }
  }

  /**
   * Calculates distance (km) and Estimated Time of Arrival (ETA in minutes) between two GPS points.
   */
  async calculateEtaAndDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    averageSpeedKmH: number = 25,
  ): Promise<{ distanceKm: number; etaMinutes: number; etaTimestamp: string }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&departure_time=now&key=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const element = data?.rows?.[0]?.elements?.[0];
          if (element && element.status === 'OK') {
            const distanceMeters = element.distance.value;
            const durationSeconds = element.duration_in_traffic
              ? element.duration_in_traffic.value
              : element.duration.value;

            const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
            const etaMinutes = Math.max(1, Math.round(durationSeconds / 60));
            const etaTimestamp = new Date(Date.now() + durationSeconds * 1000).toISOString();

            return { distanceKm, etaMinutes, etaTimestamp };
          }
        }
      } catch (err: any) {
        this.logger.warn(
          `Google Distance Matrix API call failed: ${err.message}. Using spatial estimation.`,
        );
      }
    }

    // Spatial Haversine Distance Fallback Formula
    const R = 6371; // Earth radius in km
    const dLat = ((destLat - originLat) * Math.PI) / 180;
    const dLng = ((destLng - originLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistanceKm = R * c;
    const roadDistanceKm = Math.round(straightDistanceKm * 1.3 * 100) / 100; // 1.3 road curvature multiplier

    const travelTimeHours = roadDistanceKm / Math.max(1, averageSpeedKmH);
    const etaMinutes = Math.max(1, Math.round(travelTimeHours * 60));
    const etaTimestamp = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString();

    return {
      distanceKm: roadDistanceKm,
      etaMinutes,
      etaTimestamp,
    };
  }
}
