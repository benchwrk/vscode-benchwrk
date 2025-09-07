import type { LogSource } from "../dtos/UnifiedLogResponse";

/**
 * Configuration interface for source data fetching
 */
export interface SourceFetchConfig {
  source: Source;
  line?: number;
  additionalParams?: Record<string, any>;
}

/**
 * Result interface for fetched source data
 */
export interface SourceFetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for source data fetchers
 */
export interface SourceDataFetcher {
  /**
   * Gets the source type this fetcher handles
   */
  getSourceType(): LogSource;

  /**
   * Validates the configuration for this source
   */
  validateConfig(config: SourceFetchConfig): boolean;

  /**
   * Fetches raw data from the source
   */
  fetchData(config: SourceFetchConfig): Promise<SourceFetchResult>;
}

/**
 * Abstract base class for source data fetchers
 */
export abstract class BaseSourceDataFetcher implements SourceDataFetcher {
  abstract getSourceType(): LogSource;
  abstract validateConfig(config: SourceFetchConfig): boolean;
  abstract fetchData(config: SourceFetchConfig): Promise<SourceFetchResult>;

  /**
   * Helper method to perform HTTP requests with error handling
   */
  protected async performHttpRequest(
    url: URL,
    options: RequestInit
  ): Promise<SourceFetchResult> {
    try {
      const response = await fetch(url.toString(), options);

      let body: any;
      try {
        body = await response.json();
      } catch (parseError) {
        return {
          success: false,
          error: "Failed to parse response as JSON",
          metadata: {
            status: response.status,
            statusText: response.statusText,
            parseError:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          },
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          data: body,
          metadata: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }

      return {
        success: true,
        data: body,
        metadata: {
          status: response.status,
          statusText: response.statusText,
          url: url.toString(),
        },
      };
    } catch (networkError) {
      return {
        success: false,
        error: `Network error: ${
          networkError instanceof Error
            ? networkError.message
            : String(networkError)
        }`,
        metadata: {
          networkError: true,
          url: url.toString(),
        },
      };
    }
  }

  /**
   * Helper method to extract configuration values safely
   */
  protected getConfigValue<T>(config: any, key: string, defaultValue?: T): T {
    return config?.[key] ?? defaultValue;
  }

  /**
   * Helper method to validate required configuration fields
   */
  protected validateRequiredFields(
    config: any,
    requiredFields: string[]
  ): string[] {
    const missing: string[] = [];
    for (const field of requiredFields) {
      if (!config?.[field]) {
        missing.push(field);
      }
    }
    return missing;
  }
}
