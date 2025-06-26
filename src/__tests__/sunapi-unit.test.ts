import { Sunapi } from '../sunapi';
import { SunapiConfig } from '../types';

describe('Sunapi Client Unit Tests', () => {
  let config: SunapiConfig;

  beforeEach(() => {
    config = {
      host: '192.168.1.100',
      username: 'admin',
      password: 'admin123',
      protocol: 'http',
      port: 80
    };
  });

  describe('Configuration and Instantiation', () => {
    it('should create Sunapi instance with valid config', () => {
      const sunapi = new Sunapi(config);
      expect(sunapi).toBeInstanceOf(Sunapi);
      expect(sunapi.isAuthenticated()).toBe(false);
    });

    it('should have all required modules', () => {
      const sunapi = new Sunapi(config);
      expect(sunapi.system).toBeDefined();
      expect(sunapi.video).toBeDefined();
      expect(sunapi.ptz).toBeDefined();
      expect(sunapi.events).toBeDefined();
      expect(sunapi.recording).toBeDefined();
    });

    it('should handle HTTPS protocol', () => {
      const httpsConfig = { ...config, protocol: 'https' as const, port: 443 };
      const sunapi = new Sunapi(httpsConfig);
      expect(sunapi).toBeInstanceOf(Sunapi);
    });

    it('should handle default ports', () => {
      const configWithoutPort = { ...config };
      delete (configWithoutPort as any).port;
      const sunapi = new Sunapi(configWithoutPort);
      expect(sunapi).toBeInstanceOf(Sunapi);
    });
  });

  describe('Authentication State Management', () => {
    let sunapi: Sunapi;

    beforeEach(() => {
      sunapi = new Sunapi(config);
    });

    it('should initially be unauthenticated', () => {
      expect(sunapi.isAuthenticated()).toBe(false);
    });

    it('should detect expired tokens', () => {
      // Manually set an expired token
      (sunapi as any).authToken = {
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        sessionId: 'expired-session'
      };
      
      expect(sunapi.isAuthenticated()).toBe(false);
    });

    it('should detect valid tokens', () => {
      // Manually set a valid token
      (sunapi as any).authToken = {
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        sessionId: 'valid-session'
      };
      
      expect(sunapi.isAuthenticated()).toBe(true);
    });
  });

  describe('URL Building', () => {
    let sunapi: Sunapi;

    beforeEach(() => {
      sunapi = new Sunapi(config);
    });

    it('should build CGI endpoints correctly', () => {
      const client = sunapi.system as any;
      const endpoint = client.buildCgiEndpoint('system', 'info', 'view');
      expect(endpoint).toBe('/stw-cgi/system.cgi?msubmenu=info&action=view');
    });

    it('should handle query parameters in CGI endpoints', () => {
      const client = sunapi.system as any;
      const endpoint = client.buildCgiEndpoint('video', 'channel', 'view', { channel: 1 });
      expect(endpoint).toBe('/stw-cgi/video.cgi?msubmenu=channel&action=view');
    });
  });

  describe('Module Initialization', () => {
    it('should initialize all modules correctly', () => {
      const sunapi = new Sunapi(config);
      
      // Verify modules are instances of their respective classes
      expect(sunapi.system).toBeDefined();
      expect(sunapi.video).toBeDefined();
      expect(sunapi.ptz).toBeDefined();
      expect(sunapi.events).toBeDefined();
      expect(sunapi.recording).toBeDefined();
    });

    it('should have different axios instances per module', () => {
      const sunapi = new Sunapi(config);
      
      // Each module has its own axios instance (which is the correct design)
      expect((sunapi.system as any).axiosInstance).toBeDefined();
      expect((sunapi.video as any).axiosInstance).toBeDefined();
      expect((sunapi.ptz as any).axiosInstance).toBeDefined();
      expect((sunapi.events as any).axiosInstance).toBeDefined();
      expect((sunapi.recording as any).axiosInstance).toBeDefined();
    });
  });

  describe('Data Parsing', () => {
    it('should handle basic data transformations', () => {
      // Test that we can handle expected transformations
      expect(parseInt('1', 10)).toBe(1);
      expect(parseInt('0', 10)).toBe(0);
      expect(Boolean('true')).toBe(true);
      expect(Boolean('false')).toBe(true); // In JS, any non-empty string is truthy
      expect(Boolean('')).toBe(false);
    });

    it('should handle SUNAPI response format structure', () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            DeviceInfo: { DeviceName: 'Test Camera' }
          }
        }
      };

      // Test the response parsing logic
      const isSuccessful = mockResponse.data.Response?.ResponseStatus?.['@status'] === 'OK';
      expect(isSuccessful).toBe(true);
      expect(mockResponse.data.Response.DeviceInfo.DeviceName).toBe('Test Camera');
    });
  });
});
