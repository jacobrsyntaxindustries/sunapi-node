import { SunapiClient } from '../client';
import {
  SunapiResponse,
  EventRule,
  EventLog,
  EventType,
  EventCondition,
  EventAction
} from '../types';

export class EventModule extends SunapiClient {

  /**
   * Get all event rules
   */
  public async getEventRules(): Promise<SunapiResponse<EventRule[]>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('event', 'rule', 'view')
    );

    if (response.success && response.data) {
      const rules = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: rules.map(this.parseEventRule),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Get specific event rule
   */
  public async getEventRule(ruleId: number): Promise<SunapiResponse<EventRule>> {
    const response = await this.get<any>(
      this.buildCgiEndpoint('event', 'rule', 'view'),
      { rule: ruleId }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: this.parseEventRule(response.data),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Create or update event rule
   */
  public async setEventRule(rule: Partial<EventRule> & { ruleId: number }): Promise<SunapiResponse<void>> {
    const data: any = {
      rule: rule.ruleId
    };

    if (rule.name) data.name = rule.name;
    if (rule.enabled !== undefined) data.enabled = rule.enabled ? 'on' : 'off';
    if (rule.type) data.type = rule.type;
    if (rule.conditions) data.conditions = JSON.stringify(rule.conditions);
    if (rule.actions) data.actions = JSON.stringify(rule.actions);

    return this.post<void>(
      this.buildCgiEndpoint('event', 'rule', 'set'),
      data
    );
  }

  /**
   * Delete event rule
   */
  public async deleteEventRule(ruleId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('event', 'rule', 'delete'),
      { rule: ruleId }
    );
  }

  /**
   * Enable event rule
   */
  public async enableEventRule(ruleId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('event', 'rule', 'enable'),
      { rule: ruleId, enabled: 'on' }
    );
  }

  /**
   * Disable event rule
   */
  public async disableEventRule(ruleId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('event', 'rule', 'enable'),
      { rule: ruleId, enabled: 'off' }
    );
  }

  /**
   * Get event logs
   */
  public async getEventLogs(
    startTime?: Date,
    endTime?: Date,
    eventType?: EventType,
    channelId?: number,
    limit?: number
  ): Promise<SunapiResponse<EventLog[]>> {
    const params: any = {};

    if (startTime) params.startTime = startTime.toISOString();
    if (endTime) params.endTime = endTime.toISOString();
    if (eventType) params.eventType = eventType;
    if (channelId) params.channel = channelId;
    if (limit) params.limit = limit;

    const response = await this.get<any>(
      this.buildCgiEndpoint('event', 'log', 'view'),
      params
    );

    if (response.success && response.data) {
      const logs = Array.isArray(response.data) ? response.data : [response.data];
      return {
        success: true,
        data: logs.map(this.parseEventLog),
        statusCode: response.statusCode
      };
    }

    return response;
  }

  /**
   * Clear event logs
   */
  public async clearEventLogs(): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('event', 'log', 'clear')
    );
  }

  /**
   * Test event rule (trigger manually)
   */
  public async testEventRule(ruleId: number): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('event', 'rule', 'test'),
      { rule: ruleId }
    );
  }

  /**
   * Configure motion detection
   */
  public async setMotionDetection(
    channelId: number,
    enabled: boolean,
    sensitivity?: number,
    areas?: Array<{ x: number; y: number; width: number; height: number }>
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: channelId,
      enabled: enabled ? 'on' : 'off'
    };

    if (sensitivity !== undefined) {
      data.sensitivity = sensitivity;
    }

    if (areas) {
      data.areas = JSON.stringify(areas);
    }

    return this.post<void>(
      this.buildCgiEndpoint('event', 'motion', 'set'),
      data
    );
  }

  /**
   * Get motion detection settings
   */
  public async getMotionDetection(channelId: number): Promise<SunapiResponse<any>> {
    return this.get<any>(
      this.buildCgiEndpoint('event', 'motion', 'view'),
      { channel: channelId }
    );
  }

  /**
   * Configure tampering detection
   */
  public async setTamperingDetection(
    channelId: number,
    enabled: boolean,
    sensitivity?: number
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: channelId,
      enabled: enabled ? 'on' : 'off'
    };

    if (sensitivity !== undefined) {
      data.sensitivity = sensitivity;
    }

    return this.post<void>(
      this.buildCgiEndpoint('event', 'tampering', 'set'),
      data
    );
  }

  /**
   * Configure audio detection
   */
  public async setAudioDetection(
    channelId: number,
    enabled: boolean,
    sensitivity?: number,
    threshold?: number
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: channelId,
      enabled: enabled ? 'on' : 'off'
    };

    if (sensitivity !== undefined) {
      data.sensitivity = sensitivity;
    }

    if (threshold !== undefined) {
      data.threshold = threshold;
    }

    return this.post<void>(
      this.buildCgiEndpoint('event', 'audio', 'set'),
      data
    );
  }

  /**
   * Configure intrusion detection
   */
  public async setIntrusionDetection(
    channelId: number,
    enabled: boolean,
    areas?: Array<{ points: Array<{ x: number; y: number }> }>
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: channelId,
      enabled: enabled ? 'on' : 'off'
    };

    if (areas) {
      data.areas = JSON.stringify(areas);
    }

    return this.post<void>(
      this.buildCgiEndpoint('event', 'intrusion', 'set'),
      data
    );
  }

  /**
   * Configure line crossing detection
   */
  public async setLineCrossingDetection(
    channelId: number,
    enabled: boolean,
    lines?: Array<{
      points: Array<{ x: number; y: number }>;
      direction: 'both' | 'left_to_right' | 'right_to_left';
    }>
  ): Promise<SunapiResponse<void>> {
    const data: any = {
      channel: channelId,
      enabled: enabled ? 'on' : 'off'
    };

    if (lines) {
      data.lines = JSON.stringify(lines);
    }

    return this.post<void>(
      this.buildCgiEndpoint('event', 'linecrossing', 'set'),
      data
    );
  }

  /**
   * Get notification settings
   */
  public async getNotificationSettings(): Promise<SunapiResponse<any>> {
    return this.get<any>(
      this.buildCgiEndpoint('event', 'notification', 'view')
    );
  }

  /**
   * Set notification settings
   */
  public async setNotificationSettings(settings: {
    email?: {
      enabled: boolean;
      server?: string;
      port?: number;
      username?: string;
      password?: string;
      recipients?: string[];
    };
    ftp?: {
      enabled: boolean;
      server?: string;
      port?: number;
      username?: string;
      password?: string;
      path?: string;
    };
    http?: {
      enabled: boolean;
      url?: string;
      method?: 'GET' | 'POST';
    };
  }): Promise<SunapiResponse<void>> {
    return this.post<void>(
      this.buildCgiEndpoint('event', 'notification', 'set'),
      settings
    );
  }

  // Helper methods
  private parseEventRule(data: any): EventRule {
    return {
      ruleId: parseInt(data.ruleId) || parseInt(data.rule) || 0,
      name: data.name || `Rule ${data.ruleId || data.rule}`,
      enabled: data.enabled === 'on' || data.enabled === true,
      type: data.type || 'motion',
      conditions: this.parseConditions(data.conditions),
      actions: this.parseActions(data.actions)
    };
  }

  private parseEventLog(data: any): EventLog {
    return {
      eventId: data.eventId || data.id || '',
      timestamp: new Date(data.timestamp || data.time),
      type: data.type || 'motion',
      channelId: data.channelId ? parseInt(data.channelId) : undefined,
      description: data.description || data.message || '',
      severity: data.severity || 'medium'
    };
  }

  private parseConditions(conditions: any): EventCondition[] {
    if (typeof conditions === 'string') {
      try {
        conditions = JSON.parse(conditions);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(conditions)) {
      return [];
    }

    return conditions.map((condition: any) => ({
      type: condition.type || '',
      parameters: condition.parameters || {}
    }));
  }

  private parseActions(actions: any): EventAction[] {
    if (typeof actions === 'string') {
      try {
        actions = JSON.parse(actions);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(actions)) {
      return [];
    }

    return actions.map((action: any) => ({
      type: action.type || 'notification',
      parameters: action.parameters || {}
    }));
  }
}
