import { SunapiClient } from '../client';
import {
  SunapiResponse,
  RecordingSchedule,
  RecordingSearch,
  RecordingFile,
  ScheduleBlock,
  TimeRange
} from '../types';

export class RecordingModule extends SunapiClient {

  /**
   * Get recording schedule for a channel
   */
  public async getRecordingSchedule(channelId: number): Promise<SunapiResponse<RecordingSchedule>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'schedule', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseRecordingSchedule(response.data, channelId),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Set recording schedule for a channel
   */
  public async setRecordingSchedule(schedule: RecordingSchedule): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: schedule.channelId,
      enabled: schedule.enabled ? 'on' : 'off',
      schedules: JSON.stringify(schedule.schedules)
    };

    return this.post<void>(
      this.buildCgiEndpoint('recording', 'schedule', 'set'),
      data
    );
  }

  /**
   * Start manual recording
   */
  public async startRecording(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('recording', 'control', 'start'),
      { channel: channelId }
    );
  }

  /**
   * Stop manual recording
   */
  public async stopRecording(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('recording', 'control', 'stop'),
      { channel: channelId }
    );
  }

  /**
   * Get recording status for all channels
   */
  public async getRecordingStatus(): Promise<SunapiResponse<Array<{ channelId: number; recording: boolean }>>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'status', 'view')
    );

    if (response.success && response.data) {
      const statuses = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: statuses.map((status: any) => ({
          channelId: parseInt(status.channelId) || parseInt(status.channel) || 0,
          recording: status.recording === 'on' || status.recording === true
        })),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Search for recorded files
   */
  public async searchRecordings(search: RecordingSearch): Promise<SunapiResponse<RecordingFile[]>> {
    const params: any = {
      startTime: search.startTime.toISOString(),
      endTime: search.endTime.toISOString()
    };

    if (search.channelId) params.channel = search.channelId;
    if (search.eventType) params.eventType = search.eventType;
    if (search.recordingType) params.recordingType = search.recordingType;

    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'search', 'view'),
      params
    );

    if (response.success && response.data) {
      const files = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: files.map(this.parseRecordingFile),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get recording file details
   */
  public async getRecordingFile(fileId: string): Promise<SunapiResponse<RecordingFile>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'file', 'view'),
      { file: fileId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseRecordingFile(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Download recording file
   */
  public async downloadRecording(fileId: string): Promise<SunapiResponse<Buffer>> {
    return this.get<Buffer>(
      this.buildCgiEndpoint('recording', 'file', 'download'),
      { file: fileId }
    );
  }

  /**
   * Delete recording file
   */
  public async deleteRecording(fileId: string): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('recording', 'file', 'delete'),
      { file: fileId }
    );
  }

  /**
   * Get playback URL for a recording
   */
  public async getPlaybackUrl(fileId: string): Promise<SunapiResponse<{ url: string }>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'playback', 'url'),
      { file: fileId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { url: response.data.url || response.data },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Start playback session
   */
  public async startPlayback(
    fileId: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<SunapiResponse<{ sessionId: string }>> {
    const data: any = { file: fileId };

    if (startTime) data.startTime = startTime.toISOString();
    if (endTime) data.endTime = endTime.toISOString();

    return this.post<{ sessionId: string }>(
      this.buildCgiEndpoint('recording', 'playback', 'start'),
      data
    );
  }

  /**
   * Stop playback session
   */
  public async stopPlayback(sessionId: string): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('recording', 'playback', 'stop'),
      { session: sessionId }
    );
  }

  /**
   * Control playback (play, pause, seek)
   */
  public async controlPlayback(
    sessionId: string,
    action: 'play' | 'pause' | 'seek',
    position?: number
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      session: sessionId,
      action
    };

    if (action === 'seek' && position !== undefined) {
      data.position = position;
    }

    return this.post<void>(
      this.buildCgiEndpoint('recording', 'playback', 'control'),
      data
    );
  }

  /**
   * Set playback speed
   */
  public async setPlaybackSpeed(sessionId: string, speed: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('recording', 'playback', 'speed'),
      {
        session: sessionId,
        speed
      }
    );
  }

  /**
   * Get storage usage information
   */
  public async getStorageUsage(): Promise<SunapiResponse<{
    total: number;
    used: number;
    free: number;
    recordings: number;
  }>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'storage', 'view')
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          total: parseInt(data.total) || 0,
          used: parseInt(data.used) || 0,
          free: parseInt(data.free) || 0,
          recordings: parseInt(data.recordings) || 0
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Set recording retention policy
   */
  public async setRetentionPolicy(
    retentionDays: number,
    overwriteOldest: boolean = true
  ): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('recording', 'retention', 'set'),
      {
        retentionDays,
        overwriteOldest: overwriteOldest ? 'on' : 'off'
      }
    );
  }

  /**
   * Get recording retention policy
   */
  public async getRetentionPolicy(): Promise<SunapiResponse<{
    retentionDays: number;
    overwriteOldest: boolean;
  }>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('recording', 'retention', 'view')
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          retentionDays: parseInt(data.retentionDays) || 30,
          overwriteOldest: data.overwriteOldest === 'on' || data.overwriteOldest === true
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  // Helper methods
  private parseRecordingSchedule(data: any, channelId: number): RecordingSchedule {
    return {
      channelId,
      enabled: data.enabled === 'on' || data.enabled === true,
      schedules: this.parseScheduleBlocks(data.schedules || [])
    };
  }

  private parseScheduleBlocks(schedules: any): ScheduleBlock[] {
    if (typeof schedules === 'string') {
      try {
        schedules = JSON.parse(schedules);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(schedules)) {
      return [];
    }

    return schedules.map((schedule: any) => ({
      dayOfWeek: parseInt(schedule.dayOfWeek) || 0,
      timeRanges: this.parseTimeRanges(schedule.timeRanges || []),
      recordingType: schedule.recordingType || 'continuous'
    }));
  }

  private parseTimeRanges(ranges: any): TimeRange[] {
    if (!Array.isArray(ranges)) {
      return [];
    }

    return ranges.map((range: any) => ({
      startTime: range.startTime || '00:00',
      endTime: range.endTime || '23:59'
    }));
  }

  private parseRecordingFile(data: any): RecordingFile {
    return {
      fileId: data.fileId || data.id || '',
      channelId: parseInt(data.channelId) || parseInt(data.channel) || 0,
      startTime: new Date(data.startTime || data.start),
      endTime: new Date(data.endTime || data.end),
      size: parseInt(data.size) || 0,
      recordingType: data.recordingType || 'continuous',
      eventType: data.eventType
    };
  }
}
