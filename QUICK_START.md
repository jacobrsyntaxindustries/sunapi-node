# 🎯 Quick Start Guide

## Installation

```bash
npm install sunapi-node
```

## Basic Usage

```typescript
import { Sunapi } from 'sunapi-node';

const sunapi = new Sunapi({
  host: '192.168.1.100',
  username: 'admin',
  password: 'admin123',
  protocol: 'http',
  port: 80
});

// Connect and authenticate
await sunapi.connect();

// Get device information
const deviceInfo = await sunapi.system.getDeviceInfo();
console.log('Device:', deviceInfo.data?.deviceName);

// Get video channels
const channels = await sunapi.video.getVideoChannels();
console.log('Channels:', channels.data?.length);

// Control PTZ camera
await sunapi.ptz.panLeft(1, 50);
await sunapi.ptz.zoomIn(1, 30);

// Configure motion detection
await sunapi.events.setMotionDetection(1, true, 80);

// Search recordings
const recordings = await sunapi.recording.searchRecordings({
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-02')
});

// Disconnect when done
await sunapi.disconnect();
```

## CLI Usage

```bash
# Get device info
npx sunapi-cli info --host 192.168.1.100 --username admin --password admin123

# Get system status
npx sunapi-cli status --host 192.168.1.100 --username admin --password admin123

# Control PTZ
npx sunapi-cli ptz --host 192.168.1.100 --username admin --password admin123 --action pan-left --speed 50
```

## Demo

Run the included demo to see the SDK in action:

```bash
npx ts-node bin/demo.ts
```

## Features

- ✅ **Complete SUNAPI support** - All camera functions
- ✅ **TypeScript types** - Full type safety
- ✅ **Auto authentication** - Handles login/logout
- ✅ **Error handling** - Comprehensive error management
- ✅ **CLI tool** - Command line interface
- ✅ **Examples** - Real-world usage samples
- ✅ **Tests** - Full test coverage

## Support

For the complete API documentation and advanced usage, see the main [README.md](README.md) file.
