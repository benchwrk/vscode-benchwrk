import { BaseLogFormatter } from "./BaseLogFormatter";
import { UnifiedLogResponseBuilder } from "../dtos/UnifiedLogResponse";
import type {
  LogLevel,
  LogSource,
  UnifiedLogResponse,
} from "../dtos/UnifiedLogResponse";

/**
 * Formatter for Vercel log data
 */
export class VercelLogFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "vercel";
  }

  format(rawData: any): UnifiedLogResponse[] {
    if (!rawData || !Array.isArray(rawData)) {
      return [
        UnifiedLogResponseBuilder.create()
          .withSource("vercel")
          .withLevel("error")
          .withMessage("Invalid Vercel log format")
          .withMeta({ rawData })
          .build(),
      ];
    }

    return rawData.map(
      (log: {
        level: string;
        message: string;
        rowId: string;
        source: string;
        timestampInMs: number;
        domain: string;
        messageTruncated: true;
        requestMethod: string;
        requestPath: string;
        responseStatusCode: number;
      }) => {
        // Map Vercel log levels to our standard log levels
        const level = this.mapLogLevel(log.level);

        // Format timestamp to ISO string
        const timestamp = new Date(log.timestampInMs).toISOString();

        // Build a descriptive message that includes important context
        let message = log.message || "No message provided";

        // Add request information if available
        if (log.requestMethod && log.requestPath) {
          message = `[${log.requestMethod} ${log.requestPath}] ${message}`;
        }

        // Add status code if available
        if (log.responseStatusCode) {
          message = `[${log.responseStatusCode}] ${message}`;
        }

        // Create metadata object with additional context
        const meta: Record<string, any> = {
          rowId: log.rowId,
          source: log.source,
        };

        // Add optional fields if available
        if (log.domain) meta.domain = log.domain;
        if (log.messageTruncated) meta.messageTruncated = log.messageTruncated;
        if (log.requestMethod) meta.requestMethod = log.requestMethod;
        if (log.requestPath) meta.requestPath = log.requestPath;
        if (log.responseStatusCode)
          meta.responseStatusCode = log.responseStatusCode;

        return UnifiedLogResponseBuilder.create()
          .withSource("vercel")
          .withLevel(level)
          .withMessage(message)
          .withTimestamp(timestamp)
          .withMeta(meta)
          .build();
      }
    );
  }

  private mapLogLevel(level?: string): LogLevel {
    if (!level) return "info";

    switch (level.toLowerCase()) {
      case "error":
        return "error";
      case "warn":
      case "warning":
        return "warn";
      case "info":
      case "log":
      default:
        return "info";
    }
  }
}
