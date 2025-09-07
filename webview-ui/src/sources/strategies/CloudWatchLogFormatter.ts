import {
  UnifiedLogResponse,
  UnifiedLogResponseBuilder,
} from "../dtos/UnifiedLogResponse";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseLogFormatter } from "./BaseLogFormatter";

export class CloudWatchLogFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "cloudwatch";
  }

  format(rawData: any): UnifiedLogResponse[] {
    // Handle both CloudWatch Logs format and CloudWatch Events
    if (rawData.events && Array.isArray(rawData.events)) {
      return this.formatCloudWatchEvents(rawData.events);
    }

    if (rawData.logEvents && Array.isArray(rawData.logEvents)) {
      return this.formatCloudWatchLogs(rawData.logEvents);
    }

    return [];
  }

  private formatCloudWatchLogs(logEvents: any[]): UnifiedLogResponse[] {
    return logEvents.map((logEvent: any) => {
      const timestamp = new Date(logEvent.timestamp).toISOString();
      const level = this.extractLogLevel({ message: logEvent.message });

      return UnifiedLogResponseBuilder.create()
        .withTimestamp(timestamp)
        .withSource("cloudwatch")
        .withLevel(level)
        .withMessage(this.sanitizeMessage(logEvent.message))
        .withMeta({
          logStreamName: logEvent.logStreamName,
          eventId: logEvent.eventId,
          ingestionTime: logEvent.ingestionTime,
        })
        .build();
    });
  }

  private formatCloudWatchEvents(events: any[]): UnifiedLogResponse[] {
    return events.map((event: any) => {
      const timestamp = event.timestamp || new Date().toISOString();
      const level = this.mapCloudWatchEventToLogLevel(event);
      const message = this.buildCloudWatchEventMessage(event);

      return UnifiedLogResponseBuilder.create()
        .withTimestamp(timestamp)
        .withSource("cloudwatch")
        .withLevel(level)
        .withMessage(message)
        .withMeta({
          source: event.source,
          detailType: event["detail-type"],
          account: event.account,
          region: event.region,
          detail: event.detail,
        })
        .build();
    });
  }

  private mapCloudWatchEventToLogLevel(event: any): "info" | "error" | "warn" {
    const detailType = event["detail-type"]?.toLowerCase() || "";
    const source = event.source?.toLowerCase() || "";

    if (
      detailType.includes("failed") ||
      detailType.includes("error") ||
      source.includes("error")
    ) {
      return "error";
    }
    if (detailType.includes("warning") || detailType.includes("alarm")) {
      return "warn";
    }
    return "info";
  }

  private buildCloudWatchEventMessage(event: {
    eventId: string;
    ingestionTime: Date;
    logStreamName: string;
    message: string;
    timestamp: Date;
  }): string {
    const source = event.logStreamName || "Unknown Source";

    return `${event.message} from ${source}`;
  }
}
