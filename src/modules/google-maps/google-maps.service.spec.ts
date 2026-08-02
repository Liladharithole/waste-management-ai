import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleMapsService],
    }).compile();

    service = module.get<GoogleMapsService>(GoogleMapsService);
  });

  describe('getAddressSuggestions', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return demo suggestions if GOOGLE_MAPS_API_KEY is not defined', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      const result = await service.getAddressSuggestions('BMC');

      expect(result).toHaveProperty('suggestions');
      expect(result.suggestions[0].placePrediction.text.text).toContain('[DEMO]');
    });

    it('should query Google Places API and return suggestions if API key is defined', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
      const mockSuggestions = {
        suggestions: [
          {
            placePrediction: {
              placeId: 'ChIJuQ2z4b-z5zsR...',
              text: { text: 'BMC Office, Mumbai' },
            },
          },
        ],
      };

      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuggestions),
        }),
      ) as any;

      const result = await service.getAddressSuggestions('BMC');

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockSuggestions);
    });

    it('should throw an error if Google Places API returns a non-OK status', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'invalid key' }),
        }),
      ) as any;

      await expect(service.getAddressSuggestions('BMC')).rejects.toThrow(
        'Failed to retrieve address suggestions',
      );
    });
  });
});
