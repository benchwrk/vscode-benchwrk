import { UnifiedLogResponse } from "../dtos/UnifiedLogResponse";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { LogFormatterFactory } from "../strategies/LogFormatterFactory";

/**
 * Service class that coordinates log formatting using the Strategy pattern
 * Provides a clean interface for converting raw logs to unified format
 */
export class LogFormattingService {
  /**
   * Formats raw log data from any source into unified log responses
   */
  static formatLogs(rawData: any, source: LogSource): UnifiedLogResponse[] {
    try {
      const formatter = LogFormatterFactory.createFormatter(source);
      return formatter.format(rawData);
    } catch (error) {
      console.error(`Failed to format logs from source ${source}:`, error);
      return [];
    }
  }

  /**
   * Formats logs and returns them as JSON objects
   */
  static formatLogsAsJSON(rawData: any, source: LogSource): any[] {
    const unifiedLogs = this.formatLogs(rawData, source);
    return unifiedLogs.map((log) => log.toJSON());
  }

  /**
   * Formats logs and returns them as formatted strings
   */
  static formatLogsAsStrings(rawData: any, source: LogSource): string[] {
    const unifiedLogs = this.formatLogs(rawData, source);
    return unifiedLogs.map((log) => log.toString());
  }

  /**
   * Formats logs and returns them as a single concatenated string
   */
  static formatLogsAsText(rawData: any, source: LogSource): string {
    const logStrings = this.formatLogsAsStrings(rawData, source);
    return logStrings.join("\n");
  }

  /**
   * Checks if a source is supported
   */
  static isSourceSupported(source: string): source is LogSource {
    return LogFormatterFactory.hasFormatter(source as LogSource);
  }

  /**
   * Gets all supported sources
   */
  static getSupportedSources(): LogSource[] {
    return LogFormatterFactory.getAvailableSources();
  }
}
