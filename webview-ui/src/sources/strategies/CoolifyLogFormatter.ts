import {
  UnifiedLogResponse,
  UnifiedLogResponseBuilder,
} from "../dtos/UnifiedLogResponse";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseLogFormatter } from "./BaseLogFormatter";

export class CoolifyLogFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "coolify";
  }

  format(rawData: any): UnifiedLogResponse[] {
    if (!rawData || typeof rawData !== "string") {
      return [];
    }

    // Split logs by newlines and process each line
    const logLines = rawData.split("\n").filter((line) => line.trim());

    return logLines.map((line, index) => {
      // Parse Coolify log format - usually contains timestamp and message
      const logMatch = line.match(
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s+(.+)$/
      );

      let timestamp: string;
      let message: string;

      if (logMatch) {
        timestamp = logMatch[1];
        message = logMatch[2];
      } else {
        // If no timestamp found, use current time with incremental milliseconds
        const now = new Date();
        now.setMilliseconds(now.getMilliseconds() + index);
        timestamp = now.toISOString();
        message = line;
      }

      const level = this.extractLogLevel({ message });

      return UnifiedLogResponseBuilder.create()
        .withTimestamp(timestamp)
        .withSource("coolify")
        .withLevel(level)
        .withMessage(this.sanitizeMessage(message))
        .withMeta({
          originalLine: line,
          lineNumber: index + 1,
          source: "coolify",
        })
        .build();
    });
  }
}
