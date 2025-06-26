// Core types for SUNAPI
export interface SunapiConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
  protocol?: 'http' | 'https';
  timeout?: number;
  retries?: number;
}

export interface SunapiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Authentication types
export interface AuthToken {
  token: string;
  expiresAt: Date;
  sessionId?: string;
}

export interface LoginResponse {
  token: string;
  sessionId: string;
  userLevel: string;
  maxSessions: number;
}

// System types
export interface SystemInfo {
  deviceName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  macAddress: string;
  uptime: number;
  temperature?: number;
  fanStatus?: string;
}

export interface SystemStatus {
  cpu: number;
  memory: number;
  storage: StorageInfo[];
  network: NetworkInfo[];
  temperature?: number;
}

export interface StorageInfo {
  device: string;
  totalSize: number;
  usedSize: number;
  freeSize: number;
  status: 'normal' | 'error' | 'formatting';
}

export interface NetworkInfo {
  interface: string;
  ipAddress: string;
  macAddress: string;
  speed: string;
  duplex: string;
  status: 'connected' | 'disconnected';
}

// Video/Audio types
export interface VideoChannel {
  channelId: number;
  name: string;
  enabled: boolean;
  codec: string;
  resolution: string;
  framerate: number;
  bitrate: number;
  quality: string;
}

export interface AudioChannel {
  channelId: number;
  enabled: boolean;
  codec: string;
  bitrate: number;
  sampleRate: number;
}

export interface StreamProfile {
  profileId: number;
  name: string;
  video: VideoChannel;
  audio?: AudioChannel;
}

// PTZ types
export interface PtzCapabilities {
  pan: boolean;
  tilt: boolean;
  zoom: boolean;
  focus: boolean;
  iris: boolean;
  presets: boolean;
  tours: boolean;
  patterns: boolean;
}

export interface PtzPosition {
  pan: number;
  tilt: number;
  zoom: number;
}

export interface PtzPreset {
  presetId: number;
  name: string;
  position: PtzPosition;
}

// Event types
export interface EventRule {
  ruleId: number;
  name: string;
  enabled: boolean;
  type: EventType;
  conditions: EventCondition[];
  actions: EventAction[];
}

export type EventType = 
  | 'motion'
  | 'tampering'
  | 'sound'
  | 'intrusion'
  | 'lineCrossing'
  | 'loitering'
  | 'faceDetection'
  | 'vehicleDetection'
  | 'systemError';

export interface EventCondition {
  type: string;
  parameters: Record<string, any>;
}

export interface EventAction {
  type: 'notification' | 'recording' | 'relay' | 'email' | 'ftp';
  parameters: Record<string, any>;
}

export interface EventLog {
  eventId: string;
  timestamp: Date;
  type: EventType;
  channelId?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Recording types
export interface RecordingSchedule {
  channelId: number;
  enabled: boolean;
  schedules: ScheduleBlock[];
}

export interface ScheduleBlock {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  timeRanges: TimeRange[];
  recordingType: 'continuous' | 'event' | 'motion';
}

export interface TimeRange {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

export interface RecordingSearch {
  channelId?: number;
  startTime: Date;
  endTime: Date;
  eventType?: EventType;
  recordingType?: 'continuous' | 'event' | 'motion';
}

export interface RecordingFile {
  fileId: string;
  channelId: number;
  startTime: Date;
  endTime: Date;
  size: number;
  recordingType: string;
  eventType?: EventType;
}

// User management types
export interface User {
  userId: string;
  username: string;
  userLevel: 'admin' | 'operator' | 'viewer';
  enabled: boolean;
  description?: string;
  lastLogin?: Date;
}

export interface UserPermissions {
  system: boolean;
  network: boolean;
  users: boolean;
  events: boolean;
  recording: boolean;
  playback: boolean;
  ptz: boolean;
  channels: number[]; // Accessible channel IDs
}

// Network types
export interface NetworkSettings {
  dhcp: boolean;
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  dns1?: string;
  dns2?: string;
  httpPort: number;
  httpsPort: number;
  rtspPort: number;
}

// Image types
export interface ImageSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sharpness: number;
  whiteBalance: 'auto' | 'indoor' | 'outdoor' | 'manual';
  dayNightMode: 'auto' | 'day' | 'night';
  backlightCompensation: boolean;
  wideDynamicRange: boolean;
}

// Error types
export class SunapiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'SunapiError';
  }
}

export class AuthenticationError extends SunapiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class ConnectionError extends SunapiError {
  constructor(message: string = 'Connection failed') {
    super(message, 0);
    this.name = 'ConnectionError';
  }
}

export class ValidationError extends SunapiError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
