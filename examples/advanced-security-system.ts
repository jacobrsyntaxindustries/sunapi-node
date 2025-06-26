import { Sunapi, EventType } from '../src';
import * as fs from 'fs';

/**
 * Advanced SUNAPI usage examples demonstrating:
 * - Multi-camera management
 * - Event monitoring and response
 * - Automated recording schedules
 * - PTZ patrol patterns
 */

class SecuritySystem {
  private sunapi: Sunapi;
  private cameras: number[] = [1, 2, 3, 4]; // Camera channel IDs
  private monitoringActive = false;

  constructor(config: any) {
    this.sunapi = new Sunapi(config);
  }

  async initialize(): Promise<void> {
    console.log('Initializing security system...');
    await this.sunapi.connect();

    // Get device info and validate connection
    const deviceInfo = await this.sunapi.system.getDeviceInfo();
    if (deviceInfo.success) {
      console.log(`Connected to ${deviceInfo.data?.deviceName} (${deviceInfo.data?.model})`);
    }

    // Setup cameras
    await this.setupCameras();
    
    // Configure event detection
    await this.configureEventDetection();
    
    // Setup recording schedules
    await this.setupRecordingSchedules();
    
    console.log('Security system initialized successfully');
  }

  private async setupCameras(): Promise<void> {
    console.log('Configuring cameras...');
    
    for (const channelId of this.cameras) {
      // Configure video settings for optimal quality
      await this.sunapi.video.setVideoChannel(channelId, {
        enabled: true,
        codec: 'H.264',
        resolution: '1920x1080',
        framerate: 30,
        bitrate: 4000,
        quality: 'high'
      });

      // Configure image settings for better detection
      await this.sunapi.video.setImageSettings(channelId, {
        brightness: 50,
        contrast: 60,
        saturation: 50,
        dayNightMode: 'auto',
        backlightCompensation: true,
        wideDynamicRange: true
      });

      console.log(`Camera ${channelId} configured`);
    }
  }

  private async configureEventDetection(): Promise<void> {
    console.log('Configuring event detection...');

    // Setup email notifications
    await this.sunapi.events.setNotificationSettings({
      email: {
        enabled: true,
        server: 'smtp.company.com',
        port: 587,
        username: 'security@company.com',
        password: 'email-password',
        recipients: ['admin@company.com', 'security@company.com']
      }
    });

    // Configure motion detection for each camera
    for (const channelId of this.cameras) {
      // Enable motion detection with medium sensitivity
      await this.sunapi.events.setMotionDetection(channelId, true, 60);

      // Create event rule for motion detection
      await this.sunapi.events.setEventRule({
        ruleId: channelId,
        name: `Motion Detection Camera ${channelId}`,
        enabled: true,
        type: 'motion',
        conditions: [
          {
            type: 'motion',
            parameters: { channelId, sensitivity: 60 }
          }
        ],
        actions: [
          {
            type: 'email',
            parameters: {
              subject: `Motion Alert - Camera ${channelId}`,
              message: `Motion detected on camera ${channelId} at ${new Date().toISOString()}`
            }
          },
          {
            type: 'recording',
            parameters: { duration: 300 } // 5 minutes
          }
        ]
      });

      console.log(`Motion detection configured for camera ${channelId}`);
    }

    // Setup tampering detection for critical cameras
    const criticalCameras = [1, 2]; // Front entrance and server room
    for (const channelId of criticalCameras) {
      await this.sunapi.events.setTamperingDetection(channelId, true, 80);
      console.log(`Tampering detection configured for camera ${channelId}`);
    }
  }

  private async setupRecordingSchedules(): Promise<void> {
    console.log('Setting up recording schedules...');

    for (const channelId of this.cameras) {
      // 24/7 continuous recording with event-based high-quality segments
      const schedule = {
        channelId,
        enabled: true,
        schedules: [
          // Monday to Friday - Business hours (high quality continuous)
          ...Array.from({ length: 5 }, (_, i) => ({
            dayOfWeek: i + 1, // Monday = 1, Friday = 5
            timeRanges: [
              { startTime: '08:00', endTime: '18:00' }
            ],
            recordingType: 'continuous' as const
          })),
          // Weekends and nights - Event-based recording
          ...Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            timeRanges: [
              { startTime: '18:01', endTime: '07:59' }
            ],
            recordingType: 'event' as const
          }))
        ]
      };

      await this.sunapi.recording.setRecordingSchedule(schedule);
      console.log(`Recording schedule set for camera ${channelId}`);
    }

    // Set retention policy - keep recordings for 30 days
    await this.sunapi.recording.setRetentionPolicy(30, true);
  }

  async startMonitoring(): Promise<void> {
    console.log('Starting event monitoring...');
    this.monitoringActive = true;

    // Check for new events every 30 seconds
    const monitorInterval = setInterval(async () => {
      if (!this.monitoringActive) {
        clearInterval(monitorInterval);
        return;
      }

      try {
        await this.checkForEvents();
      } catch (error) {
        console.error('Error during monitoring:', error);
      }
    }, 30000);

    console.log('Event monitoring started');
  }

  private async checkForEvents(): Promise<void> {
    const now = new Date();
    const lastCheck = new Date(now.getTime() - 35000); // 35 seconds ago with buffer

    const events = await this.sunapi.events.getEventLogs(lastCheck, now);
    
    if (events.success && events.data && events.data.length > 0) {
      console.log(`${events.data.length} new events detected`);
      
      for (const event of events.data) {
        await this.handleEvent(event);
      }
    }
  }

  private async handleEvent(event: any): Promise<void> {
    console.log(`Event: ${event.type} on channel ${event.channelId} - ${event.description}`);

    // Take immediate snapshots for motion events
    if (event.type === 'motion' && event.channelId) {
      try {
        const snapshot = await this.sunapi.video.getSnapshot(event.channelId);
        if (snapshot.success && snapshot.data) {
          const filename = `snapshot_ch${event.channelId}_${Date.now()}.jpg`;
          fs.writeFileSync(`./snapshots/${filename}`, snapshot.data);
          console.log(`Snapshot saved: ${filename}`);
        }
      } catch (error) {
        console.error('Failed to capture snapshot:', error);
      }
    }

    // For high-severity events, activate PTZ if available
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.handleHighSeverityEvent(event);
    }
  }

  private async handleHighSeverityEvent(event: any): Promise<void> {
    const channelId = event.channelId;
    
    // Check if camera has PTZ capabilities
    const ptzCapabilities = await this.sunapi.ptz.getPtzCapabilities(channelId);
    
    if (ptzCapabilities.success && ptzCapabilities.data?.presets) {
      // Go to a preset position for better view
      await this.sunapi.ptz.gotoPreset(channelId, 1); // Preset 1 = "Alert Position"
      console.log(`PTZ camera ${channelId} moved to alert position`);
      
      // Start recording immediately
      await this.sunapi.recording.startRecording(channelId);
      console.log(`Emergency recording started on camera ${channelId}`);
      
      // Stop recording after 10 minutes
      setTimeout(async () => {
        await this.sunapi.recording.stopRecording(channelId);
        console.log(`Emergency recording stopped on camera ${channelId}`);
      }, 600000); // 10 minutes
    }
  }

  async createDailyReport(): Promise<void> {
    console.log('Generating daily security report...');
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get events from last 24 hours
    const events = await this.sunapi.events.getEventLogs(yesterday, now);
    
    // Get recording storage usage
    const storageUsage = await this.sunapi.recording.getStorageUsage();
    
    // Get system status
    const systemStatus = await this.sunapi.system.getSystemStatus();
    
    const report = {
      date: now.toISOString().split('T')[0],
      summary: {
        totalEvents: events.data?.length || 0,
        motionEvents: events.data?.filter(e => e.type === 'motion').length || 0,
        tamperingEvents: events.data?.filter(e => e.type === 'tampering').length || 0,
        systemAlerts: events.data?.filter(e => e.type === 'systemError').length || 0
      },
      storage: storageUsage.data,
      system: {
        cpu: systemStatus.data?.cpu,
        memory: systemStatus.data?.memory,
        temperature: systemStatus.data?.temperature
      },
      cameras: await this.getCameraStatus()
    };
    
    // Save report
    const reportFilename = `security_report_${report.date}.json`;
    fs.writeFileSync(`./reports/${reportFilename}`, JSON.stringify(report, null, 2));
    
    console.log(`Daily report saved: ${reportFilename}`);
    console.log(`Total events: ${report.summary.totalEvents}`);
    console.log(`Storage used: ${report.storage?.used}MB / ${report.storage?.total}MB`);
  }

  private async getCameraStatus(): Promise<Array<{channelId: number; enabled: boolean; recording: boolean}>> {
    const status: Array<{channelId: number; enabled: boolean; recording: boolean}> = [];
    
    for (const channelId of this.cameras) {
      const channel = await this.sunapi.video.getVideoChannel(channelId);
      status.push({
        channelId,
        enabled: channel.data?.enabled || false,
        recording: false // Would need to check recording status
      });
    }
    
    return status;
  }

  async setupPtzPatrol(channelId: number): Promise<void> {
    console.log(`Setting up PTZ patrol for camera ${channelId}...`);
    
    // Define patrol points
    const patrolPoints = [
      { pan: 0, tilt: 0, zoom: 1, duration: 30000 },    // Front view
      { pan: 90, tilt: 15, zoom: 2, duration: 20000 },  // Right side
      { pan: 180, tilt: 0, zoom: 1, duration: 30000 },  // Back view
      { pan: 270, tilt: 15, zoom: 2, duration: 20000 }, // Left side
      { pan: 0, tilt: 45, zoom: 3, duration: 15000 }    // Overview
    ];
    
    // Save positions as presets
    for (let i = 0; i < patrolPoints.length; i++) {
      const point = patrolPoints[i];
      await this.sunapi.ptz.setPtzPosition(channelId, point);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for movement
      await this.sunapi.ptz.setPtzPreset(channelId, i + 10, `Patrol Point ${i + 1}`);
    }
    
    // Start automated patrol
    setInterval(async () => {
      for (let i = 0; i < patrolPoints.length; i++) {
        await this.sunapi.ptz.gotoPreset(channelId, i + 10);
        await new Promise(resolve => setTimeout(resolve, patrolPoints[i].duration));
      }
    }, 300000); // Complete patrol every 5 minutes
    
    console.log(`PTZ patrol configured for camera ${channelId}`);
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down security system...');
    this.monitoringActive = false;
    await this.sunapi.disconnect();
    console.log('Security system shutdown complete');
  }
}

// Usage example
async function main() {
  const securitySystem = new SecuritySystem({
    host: '192.168.1.100',
    username: 'admin',
    password: 'securepassword123',
    protocol: 'http',
    port: 80
  });

  try {
    // Create directories for outputs
    if (!fs.existsSync('./snapshots')) fs.mkdirSync('./snapshots');
    if (!fs.existsSync('./reports')) fs.mkdirSync('./reports');

    await securitySystem.initialize();
    await securitySystem.startMonitoring();

    // Setup PTZ patrol for camera 1 (if it has PTZ capabilities)
    await securitySystem.setupPtzPatrol(1);

    // Generate daily reports every 24 hours
    setInterval(async () => {
      await securitySystem.createDailyReport();
    }, 24 * 60 * 60 * 1000);

    console.log('Security system is running. Press Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await securitySystem.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start security system:', error);
    await securitySystem.shutdown();
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
