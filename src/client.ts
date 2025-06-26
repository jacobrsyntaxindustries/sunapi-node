import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  SunapiConfig, 
  SunapiResponse, 
  AuthToken, 
  LoginResponse,
  SunapiError,
  AuthenticationError,
  ConnectionError
} from './types';

export class SunapiClient {
  private axiosInstance: AxiosInstance;
  private config: SunapiConfig;
  private authToken?: AuthToken;
  private sessionId?: string;

  constructor(config: SunapiConfig) {
    this.config = {
      protocol: 'http',
      port: 80,
      timeout: 30000,
      retries: 3,
      ...config
    };

    this.axiosInstance = axios.create({
      baseURL: `${this.config.protocol}://${this.config.host}:${this.config.port}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SUNAPI-Node/1.0.0'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        if (this.authToken && this.authToken.expiresAt > new Date()) {
          config.headers.Authorization = `Bearer ${this.authToken.token}`;
        }
        
        if (this.sessionId) {
          config.headers['X-Session-ID'] = this.sessionId;
        }

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.authToken) {
          // Token expired, try to refresh
          try {
            await this.login();
            // Retry the original request
            return this.axiosInstance.request(error.config!);
          } catch (refreshError) {
            throw new AuthenticationError('Session expired and refresh failed');
          }
        }
        
        throw this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): SunapiError {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ConnectionError(`Cannot connect to ${this.config.host}:${this.config.port}`);
    }
    
    if (error.response) {
      const statusCode = error.response.status;
      const responseData: any = error.response.data;
      const message = responseData?.message || error.message;
      
      if (statusCode === 401) {
        return new AuthenticationError(message);
      }
      
      return new SunapiError(message, statusCode, responseData);
    }
    
    return new SunapiError(error.message);
  }

  public async login(): Promise<SunapiResponse<LoginResponse>> {
    try {
      const response = await this.axiosInstance.post('/stw-cgi/system.cgi', {
        msubmenu: 'userlogin',
        action: 'login',
        user: this.config.username,
        pass: this.config.password
      });

      const data = response.data;
      
      if (data.status === 'OK') {
        this.authToken = {
          token: data.token || data.sessionId,
          expiresAt: new Date(Date.now() + (data.expires || 3600) * 1000),
          sessionId: data.sessionId
        };
        
        this.sessionId = data.sessionId;

        return {
          success: true,
          data: {
            token: this.authToken.token,
            sessionId: this.sessionId!,
            userLevel: data.userLevel || 'admin',
            maxSessions: data.maxSessions || 10
          }
        };
      } else {
        throw new AuthenticationError(data.message || 'Login failed');
      }
    } catch (error) {
      if (error instanceof SunapiError) {
        throw error;
      }
      throw this.handleError(error as AxiosError);
    }
  }

  public async logout(): Promise<SunapiResponse<void>> {
    try {
      if (!this.authToken) {
        return { success: true };
      }

      await this.axiosInstance.post('/stw-cgi/system.cgi', {
        msubmenu: 'userlogout',
        action: 'logout'
      });

      this.authToken = undefined;
      this.sessionId = undefined;

      return { success: true };
    } catch (error) {
      // Even if logout fails, clear local auth state
      this.authToken = undefined;
      this.sessionId = undefined;
      return { success: true };
    }
  }

  public isAuthenticated(): boolean {
    return !!(this.authToken && this.authToken.expiresAt > new Date());
  }

  public async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      const result = await this.login();
      if (!result.success) {
        throw new AuthenticationError('Failed to authenticate');
      }
    }
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<SunapiResponse<T>> {
    await this.ensureAuthenticated();

    try {
      let response: AxiosResponse;

      switch (method) {
        case 'GET':
          response = await this.axiosInstance.get(endpoint, { params });
          break;
        case 'POST':
          response = await this.axiosInstance.post(endpoint, data, { params });
          break;
        case 'PUT':
          response = await this.axiosInstance.put(endpoint, data, { params });
          break;
        case 'DELETE':
          response = await this.axiosInstance.delete(endpoint, { params });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      if (error instanceof SunapiError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        };
      }
      
      const sunapiError = this.handleError(error as AxiosError);
      return {
        success: false,
        error: sunapiError.message,
        statusCode: sunapiError.statusCode
      };
    }
  }

  public async get<T>(endpoint: string, params?: any): Promise<SunapiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  public async post<T>(endpoint: string, data?: any, params?: any): Promise<SunapiResponse<T>> {
    return this.request<T>('POST', endpoint, data, params);
  }

  public async put<T>(endpoint: string, data?: any, params?: any): Promise<SunapiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, params);
  }

  public async delete<T>(endpoint: string, params?: any): Promise<SunapiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, params);
  }

  // Utility method to build SUNAPI CGI endpoints
  protected buildCgiEndpoint(module: string, submenu?: string, action?: string): string {
    let endpoint = `/stw-cgi/${module}.cgi`;
    const params: string[] = [];

    if (submenu) {
      params.push(`msubmenu=${submenu}`);
    }
    
    if (action) {
      params.push(`action=${action}`);
    }

    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }

    return endpoint;
  }

  // Health check method
  public async ping(): Promise<SunapiResponse<{ alive: boolean }>> {
    try {
      const response = await this.axiosInstance.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view');
      return {
        success: true,
        data: { alive: true },
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        data: { alive: false },
        error: 'Device unreachable'
      };
    }
  }
}
