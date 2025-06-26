#!/usr/bin/env node

/**
 * SUNAPI CLI Tool
 * A command-line interface for interacting with Samsung SUNAPI devices
 */

import { Command } from 'commander';
import { Sunapi } from '../src';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Global configuration
interface CliConfig {
  host: string;
  username: string;
  password: string;
  protocol?: 'http' | 'https';
  port?: number;
}

let config: CliConfig;

// Load configuration from file or environment
function loadConfig(): CliConfig {
  const configPath = path.join(process.cwd(), 'sunapi.config.json');
  
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  }
  
  return {
    host: process.env.SUNAPI_HOST || '',
    username: process.env.SUNAPI_USERNAME || 'admin',
    password: process.env.SUNAPI_PASSWORD || '',
    protocol: (process.env.SUNAPI_PROTOCOL as 'http' | 'https') || 'http',
    port: process.env.SUNAPI_PORT ? parseInt(process.env.SUNAPI_PORT) : 80
  };
}

// Create SUNAPI client
async function createClient(): Promise<Sunapi> {
  if (!config.host || !config.password) {
    console.error('Error: Host and password are required');
    console.error('Set them in sunapi.config.json or environment variables');
    process.exit(1);
  }
  
  const sunapi = new Sunapi(config);
  await sunapi.connect();
  return sunapi;
}

// CLI Commands

program
  .name('sunapi')
  .description('CLI tool for Samsung SUNAPI devices')
  .version('1.0.0')
  .hook('preAction', () => {
    config = loadConfig();
  });

// Device Info Commands
program
  .command('info')
  .description('Get device information')
  .action(async () => {
    const sunapi = await createClient();
    try {
      const info = await sunapi.system.getDeviceInfo();
      if (info.success) {
        console.log(JSON.stringify(info.data, null, 2));
      } else {
        console.error('Failed to get device info:', info.error);
      }
    } finally {
      await sunapi.disconnect();
    }
  });

program
  .command('status')
  .description('Get system status')
  .action(async () => {
    const sunapi = await createClient();
    try {
      const status = await sunapi.system.getSystemStatus();
      if (status.success) {
        console.log(JSON.stringify(status.data, null, 2));
      } else {
        console.error('Failed to get system status:', status.error);
      }
    } finally {
      await sunapi.disconnect();
    }
  });

// Video Commands
program
  .command('channels')
  .description('List video channels')
  .action(async () => {
    const sunapi = await createClient();
    try {
      const channels = await sunapi.video.getVideoChannels();
      if (channels.success) {
        console.log(JSON.stringify(channels.data, null, 2));
      } else {
        console.error('Failed to get video channels:', channels.error);
      }
    } finally {
      await sunapi.disconnect();
    }
  });

program
  .command('snapshot')
  .description('Take a snapshot from a channel')
  .requiredOption('-c, --channel <number>', 'Channel ID')
  .option('-o, --output <path>', 'Output file path', 'snapshot.jpg')
  .action(async (options) => {
    const sunapi = await createClient();
    try {
      const channelId = parseInt(options.channel);
      const snapshot = await sunapi.video.getSnapshot(channelId);
      
      if (snapshot.success && snapshot.data) {
        fs.writeFileSync(options.output, snapshot.data);
        console.log(`Snapshot saved to ${options.output}`);
      } else {
        console.error('Failed to capture snapshot:', snapshot.error);
      }
    } finally {
      await sunapi.disconnect();
    }
  });

// PTZ Commands
program
  .command('ptz')
  .description('PTZ camera control')
  .requiredOption('-c, --channel <number>', 'Channel ID')
  .option('--pan <degrees>', 'Pan to absolute position (degrees)')
  .option('--tilt <degrees>', 'Tilt to absolute position (degrees)')
  .option('--zoom <level>', 'Zoom to level')
  .option('--preset <id>', 'Go to preset ID')
  .option('--save-preset <id>', 'Save current position as preset ID')
  .action(async (options) => {
    const sunapi = await createClient();
    try {
      const channelId = parseInt(options.channel);
      
      if (options.preset) {
        const result = await sunapi.ptz.gotoPreset(channelId, parseInt(options.preset));
        console.log(result.success ? 'Moved to preset' : `Error: ${result.error}`);
      } else if (options.savePreset) {
        const result = await sunapi.ptz.setPtzPreset(channelId, parseInt(options.savePreset));
        console.log(result.success ? 'Preset saved' : `Error: ${result.error}`);
      } else if (options.pan || options.tilt || options.zoom) {
        const position: any = {};
        if (options.pan) position.pan = parseFloat(options.pan);
        if (options.tilt) position.tilt = parseFloat(options.tilt);
        if (options.zoom) position.zoom = parseFloat(options.zoom);
        
        const result = await sunapi.ptz.setPtzPosition(channelId, position);
        console.log(result.success ? 'PTZ moved' : `Error: ${result.error}`);
      } else {
        // Show current position
        const position = await sunapi.ptz.getPtzPosition(channelId);
        if (position.success) {
          console.log(JSON.stringify(position.data, null, 2));
        } else {
          console.error('Failed to get PTZ position:', position.error);
        }
      }
    } finally {
      await sunapi.disconnect();
    }
  });

// Recording Commands
program
  .command('recordings')
  .description('Search for recordings')
  .option('-c, --channel <number>', 'Channel ID')
  .option('-s, --start <date>', 'Start date (ISO string)')
  .option('-e, --end <date>', 'End date (ISO string)')
  .option('-l, --limit <number>', 'Limit results', '10')
  .action(async (options) => {
    const sunapi = await createClient();
    try {
      const search: any = {
        startTime: options.start ? new Date(options.start) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: options.end ? new Date(options.end) : new Date()
      };
      
      if (options.channel) {
        search.channelId = parseInt(options.channel);
      }
      
      const recordings = await sunapi.recording.searchRecordings(search);
      
      if (recordings.success) {
        const results = recordings.data?.slice(0, parseInt(options.limit)) || [];
        console.log(`Found ${recordings.data?.length} recordings (showing ${results.length}):`);
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.error('Failed to search recordings:', recordings.error);
      }
    } finally {
      await sunapi.disconnect();
    }
  });

program
  .command('record')
  .description('Start/stop manual recording')
  .requiredOption('-c, --channel <number>', 'Channel ID')
  .requiredOption('-a, --action <start|stop>', 'Action to perform')
  .action(async (options) => {
    const sunapi = await createClient();
    try {
      const channelId = parseInt(options.channel);
      
      let result;
      if (options.action === 'start') {
        result = await sunapi.recording.startRecording(channelId);
        console.log(result.success ? 'Recording started' : `Error: ${result.error}`);
      } else if (options.action === 'stop') {
        result = await sunapi.recording.stopRecording(channelId);
        console.log(result.success ? 'Recording stopped' : `Error: ${result.error}`);
      } else {
        console.error('Invalid action. Use "start" or "stop"');
      }
    } finally {
      await sunapi.disconnect();
    }
  });

// Event Commands
program
  .command('events')
  .description('Get recent events')
  .option('-t, --type <type>', 'Event type filter')
  .option('-c, --channel <number>', 'Channel ID filter')
  .option('-l, --limit <number>', 'Limit results', '20')
  .option('-h, --hours <number>', 'Hours to look back', '24')
  .action(async (options) => {
    const sunapi = await createClient();
    try {
      const hoursBack = parseInt(options.hours);
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const endTime = new Date();
      
      const events = await sunapi.events.getEventLogs(
        startTime,
        endTime,
        options.type,
        options.channel ? parseInt(options.channel) : undefined,
        parseInt(options.limit)
      );
      
      if (events.success) {
        console.log(`Found ${events.data?.length} events:`);
        console.log(JSON.stringify(events.data, null, 2));
      } else {
        console.error('Failed to get events:', events.error);
      }
    } finally {
      await sunapi.disconnect();
    }
  });

// Configuration Commands
program
  .command('config')
  .description('Generate configuration file')
  .requiredOption('-h, --host <ip>', 'Device IP address')
  .requiredOption('-u, --username <username>', 'Username')
  .requiredOption('-p, --password <password>', 'Password')
  .option('--protocol <protocol>', 'Protocol (http/https)', 'http')
  .option('--port <port>', 'Port number', '80')
  .action((options) => {
    const config = {
      host: options.host,
      username: options.username,
      password: options.password,
      protocol: options.protocol,
      port: parseInt(options.port)
    };
    
    fs.writeFileSync('sunapi.config.json', JSON.stringify(config, null, 2));
    console.log('Configuration saved to sunapi.config.json');
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.helpDisplayed') {
    // Help was displayed, exit normally
    process.exit(0);
  } else if (error.code === 'commander.missingArgument' || error.code === 'commander.invalidArgument') {
    console.error(error.message);
    process.exit(1);
  } else {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}
