import { SunapiClient } from '../client';
import {
  SunapiResponse,
  PtzCapabilities,
  PtzPosition,
  PtzPreset
} from '../types';

export class PtzModule extends SunapiClient {

  /**
   * Get PTZ capabilities for a channel
   */
  public async getPtzCapabilities(channelId: number): Promise<SunapiResponse<PtzCapabilities>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('ptz', 'capability', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          pan: data.pan === 'on' || data.pan === true,
          tilt: data.tilt === 'on' || data.tilt === true,
          zoom: data.zoom === 'on' || data.zoom === true,
          focus: data.focus === 'on' || data.focus === true,
          iris: data.iris === 'on' || data.iris === true,
          presets: data.presets === 'on' || data.presets === true,
          tours: data.tours === 'on' || data.tours === true,
          patterns: data.patterns === 'on' || data.patterns === true
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get current PTZ position
   */
  public async getPtzPosition(channelId: number): Promise<SunapiResponse<PtzPosition>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('ptz', 'position', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          pan: parseFloat(data.pan) || 0,
          tilt: parseFloat(data.tilt) || 0,
          zoom: parseFloat(data.zoom) || 0
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Move PTZ to absolute position
   */
  public async setPtzPosition(channelId: number, position: Partial<PtzPosition>): Promise<SunapiResponse<void>> {
    const data: any = { channel: channelId };

    if (position.pan !== undefined) data.pan = position.pan;
    if (position.tilt !== undefined) data.tilt = position.tilt;
    if (position.zoom !== undefined) data.zoom = position.zoom;

    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'position', 'absolute'),
      data
    );
  }

  /**
   * Move PTZ relatively
   */
  public async movePtzRelative(
    channelId: number,
    panSpeed: number = 0,
    tiltSpeed: number = 0,
    zoomSpeed: number = 0
  ): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'control', 'move'),
      {
        channel: channelId,
        pan: panSpeed,
        tilt: tiltSpeed,
        zoom: zoomSpeed
      }
    );
  }

  /**
   * Stop PTZ movement
   */
  public async stopPtz(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'control', 'stop'),
      { channel: channelId }
    );
  }

  /**
   * Pan left
   */
  public async panLeft(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.movePtzRelative(channelId, -speed, 0, 0);
  }

  /**
   * Pan right
   */
  public async panRight(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.movePtzRelative(channelId, speed, 0, 0);
  }

  /**
   * Tilt up
   */
  public async tiltUp(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.movePtzRelative(channelId, 0, speed, 0);
  }

  /**
   * Tilt down
   */
  public async tiltDown(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.movePtzRelative(channelId, 0, -speed, 0);
  }

  /**
   * Zoom in
   */
  public async zoomIn(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.movePtzRelative(channelId, 0, 0, speed);
  }

  /**
   * Zoom out
   */
  public async zoomOut(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.movePtzRelative(channelId, 0, 0, -speed);
  }

  /**
   * Focus near
   */
  public async focusNear(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'control', 'focus'),
      {
        channel: channelId,
        direction: 'near',
        speed
      }
    );
  }

  /**
   * Focus far
   */
  public async focusFar(channelId: number, speed: number = 50): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'control', 'focus'),
      {
        channel: channelId,
        direction: 'far',
        speed
      }
    );
  }

  /**
   * Auto focus
   */
  public async autoFocus(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'control', 'focus'),
      {
        channel: channelId,
        mode: 'auto'
      }
    );
  }

  /**
   * Get PTZ presets
   */
  public async getPtzPresets(channelId: number): Promise<SunapiResponse<PtzPreset[]>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('ptz', 'preset', 'view'),
      { channel: channelId }
    );

    if (response.success && response.data) {
      const presets = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: presets.map(this.parsePtzPreset),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Set PTZ preset
   */
  public async setPtzPreset(
    channelId: number,
    presetId: number,
    name?: string
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: channelId,
      preset: presetId
    };

    if (name) {
      data.name = name;
    }

    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'preset', 'set'),
      data
    );
  }

  /**
   * Go to PTZ preset
   */
  public async gotoPreset(channelId: number, presetId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'preset', 'goto'),
      {
        channel: channelId,
        preset: presetId
      }
    );
  }

  /**
   * Delete PTZ preset
   */
  public async deletePreset(channelId: number, presetId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'preset', 'delete'),
      {
        channel: channelId,
        preset: presetId
      }
    );
  }

  /**
   * Start PTZ tour
   */
  public async startTour(channelId: number, tourId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'tour', 'start'),
      {
        channel: channelId,
        tour: tourId
      }
    );
  }

  /**
   * Stop PTZ tour
   */
  public async stopTour(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'tour', 'stop'),
      { channel: channelId }
    );
  }

  /**
   * Go to PTZ home position
   */
  public async gotoHome(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'control', 'home'),
      { channel: channelId }
    );
  }

  /**
   * Start PTZ pattern recording
   */
  public async startPatternRecord(channelId: number, patternId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'pattern', 'record_start'),
      {
        channel: channelId,
        pattern: patternId
      }
    );
  }

  /**
   * Stop PTZ pattern recording
   */
  public async stopPatternRecord(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'pattern', 'record_stop'),
      { channel: channelId }
    );
  }

  /**
   * Start PTZ pattern playback
   */
  public async startPatternPlayback(channelId: number, patternId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'pattern', 'play'),
      {
        channel: channelId,
        pattern: patternId
      }
    );
  }

  /**
   * Stop PTZ pattern playback
   */
  public async stopPatternPlayback(channelId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('ptz', 'pattern', 'stop'),
      { channel: channelId }
    );
  }

  // Helper methods
  private parsePtzPreset(data: any): PtzPreset {
    return {
      presetId: parseInt(data.presetId) || parseInt(data.preset) || 0,
      name: data.name || `Preset ${data.presetId || data.preset}`,
      position: {
        pan: parseFloat(data.pan) || 0,
        tilt: parseFloat(data.tilt) || 0,
        zoom: parseFloat(data.zoom) || 0
      }
    };
  }
}
