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
}
