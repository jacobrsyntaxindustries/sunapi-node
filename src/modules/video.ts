import { SunapiClient } from '../client';
import {
  SunapiResponse,
  VideoChannel,
  AudioChannel,
  StreamProfile,
  ImageSettings
} from '../types';

export class VideoModule extends SunapiClient {

  /**
   * Get list of all video channels
   */
  public async getVideoChannels(): Promise<SunapiResponse<VideoChannel[]>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('video', 'channel', 'view')
    );

    if (response.success && response.data) {
      const channels = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: channels.map(this.parseVideoChannel),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get specific video channel configuration
   */
  public async getVideoChannel(channelId: number): Promise<SunapiResponse<VideoChannel>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('video', 'channel', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseVideoChannel(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Update video channel configuration
   */
  public async setVideoChannel(channelId: number, config: Partial<VideoChannel>): Promise<SunapiResponse<void>> {
    const data: any = { channel: channelId };

    if (config.name) data.name = config.name;
    if (config.enabled !== undefined) data.enabled = config.enabled ? 'on' : 'off';
    if (config.codec) data.codec = config.codec;
    if (config.resolution) data.resolution = config.resolution;
    if (config.framerate) data.framerate = config.framerate;
    if (config.bitrate) data.bitrate = config.bitrate;
    if (config.quality) data.quality = config.quality;

    return this.post<void>(
      this.buildCgiEndpoint('video', 'channel', 'set'),
      data
    );
  }

  /**
   * Get audio channels configuration
   */
  public async getAudioChannels(): Promise<SunapiResponse<AudioChannel[]>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('audio', 'channel', 'view')
    );

    if (response.success && response.data) {
      const channels = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: channels.map(this.parseAudioChannel),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get specific audio channel configuration
   */
  public async getAudioChannel(channelId: number): Promise<SunapiResponse<AudioChannel>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('audio', 'channel', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseAudioChannel(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Update audio channel configuration
   */
  public async setAudioChannel(channelId: number, config: Partial<AudioChannel>): Promise<SunapiResponse<void>> {
    const data: any = { channel: channelId };

    if (config.enabled !== undefined) data.enabled = config.enabled ? 'on' : 'off';
    if (config.codec) data.codec = config.codec;
    if (config.bitrate) data.bitrate = config.bitrate;
    if (config.sampleRate) data.sampleRate = config.sampleRate;

    return this.post<void>(
      this.buildCgiEndpoint('audio', 'channel', 'set'),
      data
    );
  }

  /**
   * Get stream profiles
   */
  public async getStreamProfiles(): Promise<SunapiResponse<StreamProfile[]>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('video', 'profile', 'view')
    );

    if (response.success && response.data) {
      const profiles = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: profiles.map(this.parseStreamProfile),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get specific stream profile
   */
  public async getStreamProfile(profileId: number): Promise<SunapiResponse<StreamProfile>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('video', 'profile', 'view'),
      { profile: profileId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseStreamProfile(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get image settings for a channel
   */
  public async getImageSettings(channelId: number): Promise<SunapiResponse<ImageSettings>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('image', 'channel', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseImageSettings(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Update image settings for a channel
   */
  public async setImageSettings(channelId: number, settings: Partial<ImageSettings>): Promise<SunapiResponse<void>> {
    const data: any = { channel: channelId };

    if (settings.brightness !== undefined) data.brightness = settings.brightness;
    if (settings.contrast !== undefined) data.contrast = settings.contrast;
    if (settings.saturation !== undefined) data.saturation = settings.saturation;
    if (settings.hue !== undefined) data.hue = settings.hue;
    if (settings.sharpness !== undefined) data.sharpness = settings.sharpness;
    if (settings.whiteBalance) data.whiteBalance = settings.whiteBalance;
    if (settings.dayNightMode) data.dayNightMode = settings.dayNightMode;
    if (settings.backlightCompensation !== undefined) {
      data.backlightCompensation = settings.backlightCompensation ? 'on' : 'off';
    }
    if (settings.wideDynamicRange !== undefined) {
      data.wideDynamicRange = settings.wideDynamicRange ? 'on' : 'off';
    }

    return this.post<void>(
      this.buildCgiEndpoint('image', 'channel', 'set'),
      data
    );
  }

  /**
   * Get RTSP URL for streaming
   */
  public async getRtspUrl(channelId: number, profileId?: number): Promise<SunapiResponse<{ url: string }>> {
    const params: any = { channel: channelId };
    if (profileId) params.profile = profileId;

    const response = await this.get<any>(
      this.buildCgiEndpoint('video', 'rtsp', 'url'),
      params
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
   * Get snapshot image from a channel
   */
  public async getSnapshot(channelId: number): Promise<SunapiResponse<Buffer>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('video', 'snapshot', 'view'),
      { channel: channelId }
    );

    return response;
  }

  /**
   * Start live stream
   */
  public async startLiveStream(channelId: number, profileId?: number): Promise<SunapiResponse<{ streamId: string }>> {
    const data: any = { channel: channelId };
    if (profileId) data.profile = profileId;

    return this.post<{ streamId: string }>(
      this.buildCgiEndpoint('video', 'stream', 'start'),
      data
    );
  }

  /**
   * Stop live stream
   */
  public async stopLiveStream(streamId: string): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('video', 'stream', 'stop'),
      { streamId }
    );
  }

  // Helper methods for parsing response data
  private parseVideoChannel(data: any): VideoChannel {
    return {
      channelId: parseInt(data.channelId) || parseInt(data.channel) || 0,
      name: data.name || `Channel ${data.channelId || data.channel}`,
      enabled: data.enabled === 'on' || data.enabled === true,
      codec: data.codec || 'H.264',
      resolution: data.resolution || '1920x1080',
      framerate: parseInt(data.framerate) || 30,
      bitrate: parseInt(data.bitrate) || 2000,
      quality: data.quality || 'high'
    };
  }

  private parseAudioChannel(data: any): AudioChannel {
    return {
      channelId: parseInt(data.channelId) || parseInt(data.channel) || 0,
      enabled: data.enabled === 'on' || data.enabled === true,
      codec: data.codec || 'AAC',
      bitrate: parseInt(data.bitrate) || 128,
      sampleRate: parseInt(data.sampleRate) || 48000
    };
  }

  private parseStreamProfile(data: any): StreamProfile {
    return {
      profileId: parseInt(data.profileId) || parseInt(data.profile) || 0,
      name: data.name || `Profile ${data.profileId || data.profile}`,
      video: this.parseVideoChannel(data.video || data),
      audio: data.audio ? this.parseAudioChannel(data.audio) : undefined
    };
  }

  private parseImageSettings(data: any): ImageSettings {
    return {
      brightness: parseInt(data.brightness) || 50,
      contrast: parseInt(data.contrast) || 50,
      saturation: parseInt(data.saturation) || 50,
      hue: parseInt(data.hue) || 0,
      sharpness: parseInt(data.sharpness) || 50,
      whiteBalance: data.whiteBalance || 'auto',
      dayNightMode: data.dayNightMode || 'auto',
      backlightCompensation: data.backlightCompensation === 'on' || data.backlightCompensation === true,
      wideDynamicRange: data.wideDynamicRange === 'on' || data.wideDynamicRange === true
    };
  }
}
