import { SourceDataFetcherFactory } from "../fetchers/SourceDataFetcherFactory";
import { LogFormattingService } from "./LogFormattingService";
import { UnifiedLogResponse } from "../dtos/UnifiedLogResponse";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import type { SourceFetchConfig } from "../fetchers/BaseSourceDataFetcher";

export interface StreamLogsServiceConfig {
  source: Source;
  line?: number;
  format?: "text" | "json" | "unified";
  additionalParams?: Record<string, any>;
}

export interface StreamLogsServiceResult {
  success: boolean;
  data?: string | any[] | UnifiedLogResponse[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Service that orchestrates data fetching and log formatting
 * Combines the fetcher and formatter patterns for a clean interface
 */
export class StreamLogsService {
  /**
   * Main method to fetch and format logs from any source
   */
  static async streamLogs(
    config: StreamLogsServiceConfig
  ): Promise<StreamLogsServiceResult> {
    const source = config.source.slug as LogSource;
    const outputFormat = config.format || "text";

    try {
      // Check if source is supported
      if (!SourceDataFetcherFactory.hasFetcher(source)) {
        return {
          success: false,
          error: `Unsupported source: ${source}`,
          metadata: {
            availableSources: SourceDataFetcherFactory.getAvailableSources(),
          },
        };
      }

      // Create fetcher and fetch data
      const fetcher = SourceDataFetcherFactory.createFetcher(source);

      const fetchConfig: SourceFetchConfig = {
        source: config.source,
        line: config.line,
        additionalParams: config.additionalParams,
      };

      const fetchResult = await fetcher.fetchData(fetchConfig);

      if (!fetchResult.success) {
        return {
          success: false,
          error: fetchResult.error,
          metadata: fetchResult.metadata,
        };
      }

      // Format the fetched data
      const formattedData = this.formatFetchedData(
        fetchResult.data,
        source,
        outputFormat
      );
      // console.log("Formatted Data:", formattedData);
      return {
        success: true,
        data: formattedData,
        metadata: {
          ...fetchResult.metadata,
          outputFormat,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Stream logs error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: { source, outputFormat },
      };
    }
  }

  /**
   * Formats fetched data based on the requested output format
   */
  private static formatFetchedData(
    rawData: any,
    source: LogSource,
    format: "text" | "json" | "unified"
  ): string | any[] | UnifiedLogResponse[] {
    switch (format) {
      case "json":
        return LogFormattingService.formatLogsAsJSON(rawData, source);

      case "unified":
        return LogFormattingService.formatLogs(rawData, source);

      case "text":
      default:
        return LogFormattingService.formatLogsAsText(rawData, source);
    }
  }

  /**
   * Validates a source configuration
   */
  static async validateSourceConfiguration(
    source: LogSource,
    orgSource: Source
  ): Promise<boolean> {
    try {
      const fetcher = SourceDataFetcherFactory.createFetcher(source);
      return fetcher.validateConfig({ source: orgSource });
    } catch {
      return false;
    }
  }

  /**
   * Gets all supported sources
   */
  static getSupportedSources(): LogSource[] {
    return SourceDataFetcherFactory.getAvailableSources();
  }

  /**
   * Checks if a source is supported
   */
  static isSourceSupported(source: string): source is LogSource {
    return SourceDataFetcherFactory.hasFetcher(source as LogSource);
  }

  /**
   * Test connection to a source without fetching actual data
   */
  static async testConnection(
    source: LogSource,
    orgSource: Source
  ): Promise<StreamLogsServiceResult> {
    try {
      const fetcher = SourceDataFetcherFactory.createFetcher(source);

      // Validate configuration first
      const isValidConfig = fetcher.validateConfig({ source: orgSource });

      if (!isValidConfig) {
        return {
          success: false,
          error: "Invalid source configuration",
          metadata: { source, configValid: false },
        };
      }

      // For connection testing, we could implement a minimal fetch
      // For now, we'll just validate the config
      return {
        success: true,
        data: "Connection configuration is valid",
        metadata: {
          source,
          configValid: true,
          testedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: { source },
      };
    }
  }
}
