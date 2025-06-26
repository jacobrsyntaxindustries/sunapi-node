# SUNAPI Node.js SDK

A comprehensive Node.js SDK for Samsung SUNAPI (Samsung Unified Network API), providing easy access to Samsung surveillance cameras and devices.

## Features

- 🔐 **Authentication & Session Management** - Automatic login, token refresh, and session handling
- 🎥 **Video Management** - Control video channels, profiles, and streaming
- 📹 **Recording Management** - Search, download, and manage recordings
- 🎛️ **PTZ Control** - Pan, tilt, zoom operations with preset support
- 🚨 **Event Management** - Motion detection, alerts, and notification configuration
- 🖥️ **System Management** - Device info, status monitoring, and configuration
- 📸 **Image Capture** - Snapshot capture and image settings
- 🔄 **Automatic Retry** - Built-in retry logic and error handling
- 📝 **TypeScript Support** - Full TypeScript definitions included

## Installation

```bash
npm install sunapi-node
```

## Quick Start

```typescript
import { Sunapi } from 'sunapi-node';

const sunapi = new Sunapi({
  host: '192.168.1.100',
  username: 'admin',
  password: 'your-password',
  protocol: 'http',
  port: 80
});

async function main() {
  try {
    // Connect to the device
    await sunapi.connect();
    
    // Get device information
    const deviceInfo = await sunapi.system.getDeviceInfo();
    console.log('Device:', deviceInfo.data);
    
    // Get video channels
    const channels = await sunapi.video.getVideoChannels();
    console.log('Channels:', channels.data);
    
    // Take a snapshot
    const snapshot = await sunapi.video.getSnapshot(1);
    // snapshot.data contains the image buffer
    
  } finally {
    await sunapi.disconnect();
  }
}

main().catch(console.error);
```

## Configuration

```typescript
interface SunapiConfig {
  host: string;           // Device IP address
  port?: number;          // HTTP port (default: 80)
  username: string;       // Login username
  password: string;       // Login password
  protocol?: 'http' | 'https'; // Protocol (default: 'http')
  timeout?: number;       // Request timeout in ms (default: 30000)
  retries?: number;       // Number of retries (default: 3)
}
```

## API Modules

### System Module

```typescript
// Get device information
const deviceInfo = await sunapi.system.getDeviceInfo();

// Get system status (CPU, memory, storage)
const status = await sunapi.system.getSystemStatus();

// Reboot device
await sunapi.system.reboot();

// Get/set network settings
const networkSettings = await sunapi.system.getNetworkSettings();
await sunapi.system.setNetworkSettings({
  dhcp: false,
  ipAddress: '192.168.1.101',
  subnetMask: '255.255.255.0',
  gateway: '192.168.1.1'
});

// Time management
await sunapi.system.setSystemTime(new Date(), 'America/New_York');
await sunapi.system.setNtpSettings(true, 'pool.ntp.org');
```

### Video Module

```typescript
// Get video channels
const channels = await sunapi.video.getVideoChannels();

// Configure video channel
await sunapi.video.setVideoChannel(1, {
  enabled: true,
  codec: 'H.264',
  resolution: '1920x1080',
  framerate: 30,
  bitrate: 4000
});

// Get streaming URL
const rtspUrl = await sunapi.video.getRtspUrl(1);

// Take snapshot
const snapshot = await sunapi.video.getSnapshot(1);

// Image settings
await sunapi.video.setImageSettings(1, {
  brightness: 50,
  contrast: 60,
  saturation: 55,
  dayNightMode: 'auto'
});
```

### PTZ Module

```typescript
// Check PTZ capabilities
const capabilities = await sunapi.ptz.getPtzCapabilities(1);

// Basic movements
await sunapi.ptz.panLeft(1, 50);    // Pan left at speed 50
await sunapi.ptz.panRight(1, 50);   // Pan right at speed 50
await sunapi.ptz.tiltUp(1, 30);     // Tilt up at speed 30
await sunapi.ptz.tiltDown(1, 30);   // Tilt down at speed 30
await sunapi.ptz.zoomIn(1, 40);     // Zoom in at speed 40
await sunapi.ptz.zoomOut(1, 40);    // Zoom out at speed 40

// Absolute positioning
await sunapi.ptz.setPtzPosition(1, {
  pan: 90,    // degrees
  tilt: 45,   // degrees
  zoom: 2.5   // zoom level
});

// Preset management
await sunapi.ptz.setPtzPreset(1, 1, 'Front Door');  // Save preset
await sunapi.ptz.gotoPreset(1, 1);                  // Go to preset
const presets = await sunapi.ptz.getPtzPresets(1);  // List presets

// Tours and patterns
await sunapi.ptz.startTour(1, 1);
await sunapi.ptz.stopTour(1);
```

### Events Module

```typescript
// Motion detection
await sunapi.events.setMotionDetection(1, true, 75, [
  { x: 100, y: 100, width: 200, height: 200 }  // Detection area
]);

// Event rules
await sunapi.events.setEventRule({
  ruleId: 1,
  name: 'Motion Alert',
  enabled: true,
  type: 'motion',
  conditions: [
    { type: 'motion', parameters: { channelId: 1, sensitivity: 50 } }
  ],
  actions: [
    { type: 'email', parameters: { recipients: ['admin@company.com'] } },
    { type: 'recording', parameters: { duration: 60 } }
  ]
});

// Get event logs
const logs = await sunapi.events.getEventLogs(
  new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  new Date(),
  'motion',  // Event type filter
  1,         // Channel filter
  100        // Limit
);

// Configure notifications
await sunapi.events.setNotificationSettings({
  email: {
    enabled: true,
    server: 'smtp.gmail.com',
    port: 587,
    username: 'camera@company.com',
    password: 'app-password',
    recipients: ['security@company.com']
  },
  ftp: {
    enabled: true,
    server: 'ftp.company.com',
    username: 'camera',
    password: 'password',
    path: '/uploads/camera1'
  }
});
```

### Recording Module

```typescript
// Search recordings
const recordings = await sunapi.recording.searchRecordings({
  startTime: new Date('2023-01-01T00:00:00Z'),
  endTime: new Date('2023-01-01T23:59:59Z'),
  channelId: 1,
  eventType: 'motion'
});

// Manual recording control
await sunapi.recording.startRecording(1);
await sunapi.recording.stopRecording(1);

// Download recording
const fileBuffer = await sunapi.recording.downloadRecording('recording-id');

// Recording schedules
await sunapi.recording.setRecordingSchedule({
  channelId: 1,
  enabled: true,
  schedules: [
    {
      dayOfWeek: 1, // Monday
      timeRanges: [
        { startTime: '09:00', endTime: '17:00' }
      ],
      recordingType: 'continuous'
    }
  ]
});

// Playback control
const session = await sunapi.recording.startPlayback('recording-id');
await sunapi.recording.controlPlayback(session.data.sessionId, 'play');
await sunapi.recording.setPlaybackSpeed(session.data.sessionId, 2.0); // 2x speed
await sunapi.recording.stopPlayback(session.data.sessionId);
```

## Error Handling

The SDK provides structured error handling:

```typescript
import { SunapiError, AuthenticationError, ConnectionError } from 'sunapi-node';

try {
  await sunapi.connect();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ConnectionError) {
    console.error('Connection failed:', error.message);
  } else if (error instanceof SunapiError) {
    console.error('SUNAPI error:', error.message, 'Status:', error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Response Format

All API methods return a standardized response:

```typescript
interface SunapiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
```

## Advanced Usage

### Custom HTTP Client Configuration

```typescript
const sunapi = new Sunapi({
  host: '192.168.1.100',
  username: 'admin',
  password: 'password',
  timeout: 60000,    // 60 second timeout
  retries: 5         // 5 retry attempts
});
```

### Event Monitoring

```typescript
// Poll for new events every 30 seconds
setInterval(async () => {
  const logs = await sunapi.events.getEventLogs(
    new Date(Date.now() - 30000),  // Last 30 seconds
    new Date()
  );
  
  if (logs.success && logs.data?.length > 0) {
    console.log(`${logs.data.length} new events detected`);
    logs.data.forEach(event => {
      console.log(`${event.type} event on channel ${event.channelId}: ${event.description}`);
    });
  }
}, 30000);
```

## Compatibility

This SDK is designed to work with Samsung surveillance devices that support SUNAPI 2.6.5, including:

- Samsung Wisenet cameras
- Samsung NVRs (Network Video Recorders)
- Samsung DVRs (Digital Video Recorders)
- Other Samsung surveillance equipment with SUNAPI support

## TypeScript

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { 
  Sunapi, 
  SunapiConfig, 
  VideoChannel, 
  EventRule, 
  RecordingFile 
} from 'sunapi-node';

const config: SunapiConfig = {
  host: '192.168.1.100',
  username: 'admin',
  password: 'password'
};

const sunapi = new Sunapi(config);
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the examples directory for more usage patterns
- Review the API documentation

## Changelog

### v1.0.0
- Initial release
- Full SUNAPI 2.6.5 support
- TypeScript definitions
- Comprehensive test suite
- Documentation and examples
