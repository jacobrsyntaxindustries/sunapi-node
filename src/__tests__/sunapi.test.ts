import { Sunapi } from '../sunapi';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {}
      }
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

describe('Sunapi Client', () => {
  let sunapi: Sunapi;
  let mockAxios: any;

  beforeEach(() => {
    sunapi = new Sunapi({
      host: '192.168.1.100',
      username: 'admin',
      password: 'admin123',
      protocol: 'http',
      port: 80
    });
    mockAxios = (sunapi as any).axiosInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should connect and authenticate successfully', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: {
              '@status': 'OK'
            },
            Token: 'mock-token-123',
            UserInfo: {
              UserLevel: 'admin',
              SessionID: 'session-456'
            }
          }
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      await sunapi.connect();
      expect(sunapi.isAuthenticated()).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith('/login', expect.any(Object));
    });

    it('should handle authentication failure', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: {
              '@status': 'ERROR',
              '@errorcode': '401',
              '#text': 'Authentication failed'
            }
          }
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      await expect(sunapi.connect()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(sunapi.connect()).rejects.toThrow();
    });
  });

  describe('System Module', () => {
    beforeEach(async () => {
      // Mock authentication state
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
    });

    it('should get device information', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            DeviceInfo: {
              DeviceName: 'Test Camera',
              Model: 'SNO-L6083R',
              SerialNumber: '0123456789',
              FirmwareVersion: '2.6.5',
              MACAddress: '00:11:22:33:44:55'
            }
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.system.getDeviceInfo();
      expect(result.success).toBe(true);
      expect(result.data?.deviceName).toBe('Test Camera');
    });

    it('should get system status', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            SystemStatus: {
              CPU: { UsagePercent: 25 },
              Memory: { UsagePercent: 60 },
              Temperature: 45
            }
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.system.getSystemStatus();
      expect(result.success).toBe(true);
      expect(result.data?.cpu).toBe(25);
    });

    it('should reboot device', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' }
          }
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await sunapi.system.reboot();
      expect(result.success).toBe(true);
    });
  });

  describe('Video Module', () => {
    beforeEach(async () => {
      // Mock authentication state
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
    });

    it('should get video channels', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            VideoChannel: [
              {
                '@channel': '1',
                Name: 'Camera 1',
                Enabled: 'true',
                Codec: 'H.264',
                Resolution: '1920x1080',
                Framerate: '30',
                Bitrate: '2000'
              }
            ]
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.video.getVideoChannels();
      expect(result.success).toBe(true);
      expect(result.data?.[0].channelId).toBe(1);
    });

    it('should get snapshot', async () => {
      const mockResponse = {
        data: Buffer.from('mock-image-data'),
        headers: { 'content-type': 'image/jpeg' }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.video.getSnapshot(1);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Buffer);
    });
  });

  describe('PTZ Module', () => {
    beforeEach(async () => {
      // Mock authentication state
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
    });

    it('should get PTZ capabilities', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            PTZCapabilities: {
              Pan: 'true',
              Tilt: 'true',
              Zoom: 'true',
              Focus: 'true',
              Presets: 'true'
            }
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.ptz.getPtzCapabilities(1);
      expect(result.success).toBe(true);
      expect(result.data?.pan).toBe(true);
    });

    it('should control PTZ movement', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' }
          }
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await sunapi.ptz.panLeft(1, 5);
      expect(result.success).toBe(true);
    });
  });

  describe('Events Module', () => {
    beforeEach(async () => {
      // Mock authentication state
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
    });

    it('should get event rules', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            EventRule: [
              {
                '@id': '1',
                Name: 'Motion Detection',
                Enabled: 'true',
                Type: 'motion'
              }
            ]
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.events.getEventRules();
      expect(result.success).toBe(true);
      expect(result.data?.[0].name).toBe('Motion Detection');
    });

    it('should enable motion detection', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' }
          }
        }
      };

      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await sunapi.events.setMotionDetection(1, true, 80);
      expect(result.success).toBe(true);
    });
  });

  describe('Recording Module', () => {
    beforeEach(async () => {
      // Mock authentication state
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
    });

    it('should search recordings', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            RecordingList: [
              {
                FileID: 'rec001',
                ChannelID: '1',
                StartTime: '2023-01-01T10:00:00Z',
                EndTime: '2023-01-01T11:00:00Z',
                Size: '1024000',
                Type: 'continuous'
              }
            ]
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.recording.searchRecordings({
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-01T23:59:59Z')
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.[0].fileId).toBe('rec001');
    });

    it('should get recording schedule', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: { '@status': 'OK' },
            RecordingSchedule: {
              '@channel': '1',
              Enabled: 'true',
              Schedule: [
                {
                  Day: 'Monday',
                  StartTime: '00:00:00',
                  EndTime: '23:59:59',
                  Type: 'continuous'
                }
              ]
            }
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.recording.getRecordingSchedule(1);
      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Mock authentication state
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        data: {
          Response: {
            ResponseStatus: {
              '@status': 'ERROR',
              '@errorcode': '500',
              '#text': 'Internal server error'
            }
          }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await sunapi.system.getDeviceInfo();
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle network timeouts', async () => {
      mockAxios.get.mockRejectedValue(new Error('timeout'));

      const result = await sunapi.system.getDeviceInfo();
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Utility Methods', () => {
    it('should check authentication status', () => {
      expect(sunapi.isAuthenticated()).toBe(false);
      
      (sunapi as any).authToken = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        sessionId: 'mock-session-id'
      };
      
      expect(sunapi.isAuthenticated()).toBe(true);
    });

    it('should handle expired tokens', () => {
      (sunapi as any).authToken = {
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        sessionId: 'expired-session'
      };
      
      expect(sunapi.isAuthenticated()).toBe(false);
    });
  });
});
