import { UnifiedLogResponse } from "../dtos/UnifiedLogResponse";
import type { LogLevel, LogSource } from "../dtos/UnifiedLogResponse";

/**
 * Strategy interface for formatting logs from different sources
 */
export interface LogFormatterStrategy {
  format(rawData: any): UnifiedLogResponse[];
  getSource(): LogSource;
}

/**
 * Abstract base class for log formatters
 */
export abstract class BaseLogFormatter implements LogFormatterStrategy {
  abstract format(rawData: any): UnifiedLogResponse[];
  abstract getSource(): LogSource;

  protected extractLogLevel(data: any): LogLevel {
    // Default implementation - subclasses can override
    if (data.level) {
      const level = data.level.toLowerCase();
      if (["info", "error", "warn"].includes(level)) {
        return level as LogLevel;
      }
    }

    // Try to infer from message or status
    if (data.message || data.title) {
      const text = (data.message || data.title).toLowerCase();
      if (text.includes("error") || text.includes("fail")) return "error";
      if (text.includes("warn")) return "warn";
    }

    return "info";
  }

  protected sanitizeMessage(message: string): string {
    // Remove ANSI color codes and trim
    return message.replace(/\x1b\[[0-9;]*m/g, "").trim();
  }
}
