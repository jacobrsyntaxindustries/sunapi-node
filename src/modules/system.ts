import { SunapiClient } from '../client';
import {
  SunapiResponse,
  SystemInfo,
  SystemStatus,
  StorageInfo,
  NetworkInfo,
  NetworkSettings
} from '../types';

export class SystemModule extends SunapiClient {
  
  /**
   * Get basic device information
   */
  public async getDeviceInfo(): Promise<SunapiResponse<SystemInfo>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('system', 'deviceinfo', 'view')
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          deviceName: data.deviceName || data.name || 'Unknown',
          model: data.model || data.deviceModel || 'Unknown',
          serialNumber: data.serialNumber || data.serial || 'Unknown',
          firmwareVersion: data.firmwareVersion || data.version || 'Unknown',
          macAddress: data.macAddress || data.mac || 'Unknown',
          uptime: data.uptime || 0,
          temperature: data.temperature,
          fanStatus: data.fanStatus
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get current system status including CPU, memory, and storage
   */
  public async getSystemStatus(): Promise<SunapiResponse<SystemStatus>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('system', 'status', 'view')
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          cpu: data.cpu || 0,
          memory: data.memory || 0,
          storage: this.parseStorageInfo(data.storage || []),
          network: this.parseNetworkInfo(data.network || []),
          temperature: data.temperature
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get storage information for all connected devices
   */
  public async getStorageInfo(): Promise<SunapiResponse<StorageInfo[]>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('system', 'storage', 'view')
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseStorageInfo(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Format storage device
   */
  public async formatStorage(device: string): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('system', 'storage', 'format'),
      { device }
    );
  }

  /**
   * Get network configuration
   */
  public async getNetworkSettings(): Promise<SunapiResponse<NetworkSettings>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('network', 'interface', 'view')
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          dhcp: data.dhcp === 'on' || data.dhcp === true,
          ipAddress: data.ipAddress || data.ip,
          subnetMask: data.subnetMask || data.netmask,
          gateway: data.gateway || data.defaultGateway,
          dns1: data.dns1 || data.primaryDns,
          dns2: data.dns2 || data.secondaryDns,
          httpPort: parseInt(data.httpPort) || 80,
          httpsPort: parseInt(data.httpsPort) || 443,
          rtspPort: parseInt(data.rtspPort) || 554
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Update network configuration
   */
  public async setNetworkSettings(settings: Partial<NetworkSettings>): Promise<SunapiResponse<void>> {
    const data: any = {};

    if (settings.dhcp !== undefined) {
      data.dhcp = settings.dhcp ? 'on' : 'off';
    }
    if (settings.ipAddress) data.ipAddress = settings.ipAddress;
    if (settings.subnetMask) data.subnetMask = settings.subnetMask;
    if (settings.gateway) data.gateway = settings.gateway;
    if (settings.dns1) data.dns1 = settings.dns1;
    if (settings.dns2) data.dns2 = settings.dns2;
    if (settings.httpPort) data.httpPort = settings.httpPort.toString();
    if (settings.httpsPort) data.httpsPort = settings.httpsPort.toString();
    if (settings.rtspPort) data.rtspPort = settings.rtspPort.toString();

    return this.post<void>(
      this.buildCgiEndpoint('network', 'interface', 'set'),
      data
    );
  }

  /**
   * Reboot the device
   */
  public async reboot(): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('system', 'control', 'reboot')
    );
  }

  /**
   * Reset device to factory defaults
   */
  public async factoryReset(): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('system', 'control', 'factory_reset')
    );
  }

  /**
   * Get system time
   */
  public async getSystemTime(): Promise<SunapiResponse<{ time: Date; timezone: string }>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('system', 'time', 'view')
    );

    if (response.success && response.data) {
      const data = response.data;
      return {
        success: true,
        data: {
          time: new Date(data.currentTime || data.time),
          timezone: data.timezone || 'UTC'
        },
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Set system time
   */
  public async setSystemTime(time: Date, timezone?: string): Promise<SunapiResponse<void>> {
    const data: any = {
      time: time.toISOString()
    };

    if (timezone) {
      data.timezone = timezone;
    }

    return this.post<void>(
      this.buildCgiEndpoint('system', 'time', 'set'),
      data
    );
  }

  /**
   * Enable/disable NTP (Network Time Protocol)
   */
  public async setNtpSettings(enabled: boolean, server?: string): Promise<SunapiResponse<void>> {
    const data: any = {
      ntp: enabled ? 'on' : 'off'
    };

    if (server) {
      data.ntpServer = server;
    }

    return this.post<void>(
      this.buildCgiEndpoint('system', 'time', 'ntp'),
      data
    );
  }

  /**
   * Get system logs
   */
  public async getSystemLogs(
    startTime?: Date,
    endTime?: Date,
    limit?: number
  ): Promise<SunapiResponse<any[]>> {
    const params: any = {};

    if (startTime) {
      params.startTime = startTime.toISOString();
    }
    if (endTime) {
      params.endTime = endTime.toISOString();
    }
    if (limit) {
      params.limit = limit.toString();
    }

    return this.get<any[]>(
      this.buildCgiEndpoint('system', 'log', 'view'),
      params
    );
  }

  /**
   * Clear system logs
   */
  public async clearSystemLogs(): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('system', 'log', 'clear')
    );
  }

  /**
   * Export system configuration
   */
  public async exportConfiguration(): Promise<SunapiResponse<string>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('system', 'config', 'export')
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.config || response.data,
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Import system configuration
   */
  public async importConfiguration(configData: string): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('system', 'config', 'import'),
      { config: configData }
    );
  }

  // Helper methods for parsing response data
  private parseStorageInfo(storageData: any[]): StorageInfo[] {
    if (!Array.isArray(storageData)) {
      return [];
    }

    return storageData.map(item => ({
      device: item.device || item.name || 'Unknown',
      totalSize: parseInt(item.totalSize) || 0,
      usedSize: parseInt(item.usedSize) || 0,
      freeSize: parseInt(item.freeSize) || parseInt(item.totalSize) - parseInt(item.usedSize) || 0,
      status: item.status === 'OK' || item.status === 'normal' ? 'normal' : 
              item.status === 'formatting' ? 'formatting' : 'error'
    }));
  }

  private parseNetworkInfo(networkData: any[]): NetworkInfo[] {
    if (!Array.isArray(networkData)) {
      return [];
    }

    return networkData.map(item => ({
      interface: item.interface || item.name || 'eth0',
      ipAddress: item.ipAddress || item.ip || '0.0.0.0',
      macAddress: item.macAddress || item.mac || '00:00:00:00:00:00',
      speed: item.speed || 'Unknown',
      duplex: item.duplex || 'Unknown',
      status: item.status === 'up' || item.connected ? 'connected' : 'disconnected'
    }));
  }
}
