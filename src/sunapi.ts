import { SunapiClient } from './client';
import { SystemModule } from './modules/system';
import { VideoModule } from './modules/video';
import { PtzModule } from './modules/ptz';
import { EventModule } from './modules/events';
import { RecordingModule } from './modules/recording';
import { SunapiConfig } from './types';

/**
 * Main SUNAPI client class that provides access to all modules
 */
export class Sunapi extends SunapiClient {
  public readonly system: SystemModule;
  public readonly video: VideoModule;
  public readonly ptz: PtzModule;
  public readonly events: EventModule;
  public readonly recording: RecordingModule;

  constructor(config: SunapiConfig) {
    super(config);
    
    // Initialize all modules with the same configuration
    this.system = new SystemModule(config);
    this.video = new VideoModule(config);
    this.ptz = new PtzModule(config);
    this.events = new EventModule(config);
    this.recording = new RecordingModule(config);
  }

  /**
   * Initialize the connection and authenticate
   */
  public async connect(): Promise<void> {
    const result = await this.login();
    if (!result.success) {
      throw new Error(`Failed to connect: ${result.error}`);
    }

    // Share authentication state with all modules
    const authToken = (this as any).authToken;
    const sessionId = (this as any).sessionId;

    if (authToken && sessionId) {
      (this.system as any).authToken = authToken;
      (this.system as any).sessionId = sessionId;
      
      (this.video as any).authToken = authToken;
      (this.video as any).sessionId = sessionId;
      
      (this.ptz as any).authToken = authToken;
      (this.ptz as any).sessionId = sessionId;
      
      (this.events as any).authToken = authToken;
      (this.events as any).sessionId = sessionId;
      
      (this.recording as any).authToken = authToken;
      (this.recording as any).sessionId = sessionId;
    }
  }

  /**
   * Disconnect and clean up resources
   */
  public async disconnect(): Promise<void> {
    await this.logout();
    
    // Clear authentication state from all modules
    (this.system as any).authToken = undefined;
    (this.system as any).sessionId = undefined;
    
    (this.video as any).authToken = undefined;
    (this.video as any).sessionId = undefined;
    
    (this.ptz as any).authToken = undefined;
    (this.ptz as any).sessionId = undefined;
    
    (this.events as any).authToken = undefined;
    (this.events as any).sessionId = undefined;
    
    (this.recording as any).authToken = undefined;
    (this.recording as any).sessionId = undefined;
  }

  /**
   * Get device information and verify connection
   */
  public async getDeviceInfo() {
    return this.system.getDeviceInfo();
  }

  /**
   * Health check - ping the device
   */
  public async healthCheck() {
    return this.ping();
  }
}
