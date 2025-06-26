import { Sunapi } from '../src';

async function main() {
  // Create a new SUNAPI client instance
  const sunapi = new Sunapi({
    host: '192.168.1.100',
    username: 'admin',
    password: 'admin123',
    protocol: 'http',
    port: 80,
    timeout: 30000
  });

  try {
    // Connect to the device
    console.log('Connecting to SUNAPI device...');
    await sunapi.connect();
    console.log('Connected successfully!');

    // Get device information
    console.log('Getting device information...');
    const deviceInfo = await sunapi.system.getDeviceInfo();
    if (deviceInfo.success) {
      console.log('Device Info:', deviceInfo.data);
    }

    // Get system status
    console.log('Getting system status...');
    const systemStatus = await sunapi.system.getSystemStatus();
    if (systemStatus.success) {
      console.log('System Status:', systemStatus.data);
    }

    // Get video channels
    console.log('Getting video channels...');
    const videoChannels = await sunapi.video.getVideoChannels();
    if (videoChannels.success) {
      console.log('Video Channels:', videoChannels.data);
    }

    // Get PTZ capabilities for channel 1
    console.log('Getting PTZ capabilities...');
    const ptzCapabilities = await sunapi.ptz.getPtzCapabilities(1);
    if (ptzCapabilities.success) {
      console.log('PTZ Capabilities:', ptzCapabilities.data);
    }

    // Move PTZ camera
    if (ptzCapabilities.success && ptzCapabilities.data?.pan) {
      console.log('Moving PTZ camera...');
      const moveResult = await sunapi.ptz.setPtzPosition(1, { pan: 90, tilt: 45 });
      if (moveResult.success) {
        console.log('PTZ moved successfully');
      }
    }

    // Get event rules
    console.log('Getting event rules...');
    const eventRules = await sunapi.events.getEventRules();
    if (eventRules.success) {
      console.log('Event Rules:', eventRules.data);
    }

    // Search for recordings from the last 24 hours
    console.log('Searching for recordings...');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recordings = await sunapi.recording.searchRecordings({
      startTime: yesterday,
      endTime: now
    });
    
    if (recordings.success) {
      console.log(`Found ${recordings.data?.length} recordings`);
      recordings.data?.forEach(recording => {
        console.log(`- Recording ${recording.fileId}: ${recording.startTime} to ${recording.endTime}`);
      });
    }

    // Get a snapshot from channel 1
    console.log('Taking snapshot...');
    const snapshot = await sunapi.video.getSnapshot(1);
    if (snapshot.success) {
      console.log('Snapshot captured successfully');
      // In a real application, you might save this to a file
      // fs.writeFileSync('snapshot.jpg', snapshot.data);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect when done
    console.log('Disconnecting...');
    await sunapi.disconnect();
    console.log('Disconnected');
  }
}

// Example of event handling
async function eventHandlingExample() {
  const sunapi = new Sunapi({
    host: '192.168.1.100',
    username: 'admin',
    password: 'admin123'
  });

  await sunapi.connect();

  try {
    // Configure motion detection
    console.log('Configuring motion detection...');
    await sunapi.events.setMotionDetection(1, true, 50, [
      { x: 100, y: 100, width: 200, height: 200 }
    ]);

    // Set up email notifications
    console.log('Configuring email notifications...');
    await sunapi.events.setNotificationSettings({
      email: {
        enabled: true,
        server: 'smtp.gmail.com',
        port: 587,
        username: 'your-email@gmail.com',
        password: 'your-app-password',
        recipients: ['admin@company.com']
      }
    });

    // Create an event rule for motion detection with email notification
    await sunapi.events.setEventRule({
      ruleId: 1,
      name: 'Motion Detection Alert',
      enabled: true,
      type: 'motion',
      conditions: [
        {
          type: 'motion',
          parameters: { channelId: 1, sensitivity: 50 }
        }
      ],
      actions: [
        {
          type: 'email',
          parameters: { 
            subject: 'Motion Detected',
            message: 'Motion detected on camera 1'
          }
        },
        {
          type: 'recording',
          parameters: { duration: 60 }
        }
      ]
    });

    console.log('Event rule configured successfully');

  } finally {
    await sunapi.disconnect();
  }
}

// Example of recording management
async function recordingExample() {
  const sunapi = new Sunapi({
    host: '192.168.1.100',
    username: 'admin',
    password: 'admin123'
  });

  await sunapi.connect();

  try {
    // Set up recording schedule for continuous recording during business hours
    const schedule = {
      channelId: 1,
      enabled: true,
      schedules: [
        {
          dayOfWeek: 1, // Monday
          timeRanges: [
            { startTime: '09:00', endTime: '17:00' }
          ],
          recordingType: 'continuous' as const
        },
        {
          dayOfWeek: 2, // Tuesday
          timeRanges: [
            { startTime: '09:00', endTime: '17:00' }
          ],
          recordingType: 'continuous' as const
        },
        // ... other weekdays
      ]
    };

    await sunapi.recording.setRecordingSchedule(schedule);
    console.log('Recording schedule set');

    // Start manual recording
    await sunapi.recording.startRecording(1);
    console.log('Manual recording started');

    // Wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Stop manual recording
    await sunapi.recording.stopRecording(1);
    console.log('Manual recording stopped');

  } finally {
    await sunapi.disconnect();
  }
}

// Run the main example
if (require.main === module) {
  main().catch(console.error);
}
