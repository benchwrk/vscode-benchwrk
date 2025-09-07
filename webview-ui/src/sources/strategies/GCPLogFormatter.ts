import {
  UnifiedLogResponse,
  UnifiedLogResponseBuilder,
} from "../dtos/UnifiedLogResponse";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseLogFormatter } from "./BaseLogFormatter";

export class GCPLogFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "gcp";
  }

  format(rawData: any): UnifiedLogResponse[] {
    // Handle GCP Cloud Logging format
    if (rawData.entries && Array.isArray(rawData.entries)) {
      return this.formatGCPLogEntries(rawData.entries);
    }

    // Handle single log entry
    if (rawData.logName && rawData.timestamp) {
      return [this.formatSingleGCPLogEntry(rawData)];
    }

    return [];
  }

  private formatGCPLogEntries(entries: any[]): UnifiedLogResponse[] {
    return entries.map((entry: any) => this.formatSingleGCPLogEntry(entry));
  }

  private formatSingleGCPLogEntry(entry: any): UnifiedLogResponse {
    const timestamp = entry.timestamp || new Date().toISOString();
    const level = this.mapGCPSeverityToLogLevel(entry.severity);
    const message = this.buildGCPLogMessage(entry);

    return UnifiedLogResponseBuilder.create()
      .withTimestamp(timestamp)
      .withSource("gcp")
      .withLevel(level)
      .withMessage(message)
      .withMeta({
        logName: entry.logName,
        insertId: entry.insertId,
        resource: entry.resource,
        severity: entry.severity,
        labels: entry.labels,
        sourceLocation: entry.sourceLocation,
        httpRequest: entry.httpRequest,
        operation: entry.operation,
        trace: entry.trace,
        spanId: entry.spanId,
        jsonPayload: entry.jsonPayload,
        textPayload: entry.textPayload,
        protoPayload: entry.protoPayload,
      })
      .build();
  }

  private mapGCPSeverityToLogLevel(
    severity: string
  ): "info" | "error" | "warn" {
    switch (severity?.toUpperCase()) {
      case "EMERGENCY":
      case "ALERT":
      case "CRITICAL":
      case "ERROR":
        return "error";
      case "WARNING":
        return "warn";
      case "NOTICE":
      case "INFO":
      case "DEBUG":
      default:
        return "info";
    }
  }

  private buildGCPLogMessage(entry: any): string {
    // Try to extract meaningful message from different payload types
    if (entry.textPayload) {
      return entry.textPayload;
    }

    if (entry.jsonPayload) {
      if (entry.jsonPayload.message) {
        return entry.jsonPayload.message;
      }
      if (entry.jsonPayload.msg) {
        return entry.jsonPayload.msg;
      }
      // Return formatted JSON for complex payloads
      return JSON.stringify(entry.jsonPayload);
    }

    if (entry.protoPayload) {
      if (entry.protoPayload.methodName) {
        return `${entry.protoPayload.methodName} ${
          entry.protoPayload.status?.message || ""
        }`.trim();
      }
      return JSON.stringify(entry.protoPayload);
    }

    return `GCP Log Entry from ${entry.logName || "unknown source"}`;
  }
}
