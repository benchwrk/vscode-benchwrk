import {
  UnifiedLogResponse,
  UnifiedLogResponseBuilder,
} from "../dtos/UnifiedLogResponse";
import type { LogSource, LogLevel } from "../dtos/UnifiedLogResponse";
import { BaseLogFormatter } from "./BaseLogFormatter";

export class SentryLogFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "sentry";
  }

  format(rawData: any): UnifiedLogResponse[] {
    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData.map((issue: any) => {
      const timestamp =
        issue.lastSeen || issue.firstSeen || new Date().toISOString();
      const level = this.mapSentryLevelToLogLevel(issue.level);
      const message = `Issue: ${issue.title || "Unknown issue"}`;

      return UnifiedLogResponseBuilder.create()
        .withTimestamp(timestamp)
        .withSource("sentry")
        .withLevel(level)
        .withMessage(message)
        .withMeta({
          shortId: issue.shortId,
          status: issue.status,
          count: issue.count,
          userCount: issue.userCount,
          permalink: issue.permalink,
          project: issue.project?.name,
          culprit: issue.culprit,
          type: issue.type,
          metadata: issue.metadata,
          tags: issue.tags,
        })
        .build();
    });
  }

  private mapSentryLevelToLogLevel(sentryLevel: string): LogLevel {
    switch (sentryLevel?.toLowerCase()) {
      case "fatal":
      case "error":
        return "error";
      case "warning":
        return "warn";
      case "info":
      case "debug":
      default:
        return "info";
    }
  }
}
