import {
  UnifiedLogResponse,
  UnifiedLogResponseBuilder,
} from "../dtos/UnifiedLogResponse";
import type { LogSource, LogLevel } from "../dtos/UnifiedLogResponse";
import { BaseLogFormatter } from "./BaseLogFormatter";

export class NewRelicFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "newrelic";
  }

  format(rawData: any): UnifiedLogResponse[] {
    // Handle New Relic NRQL query response (check this first before generic results array)
    if (rawData.results && rawData.results.length > 0 && rawData.results[0].events) {
      return this.formatNewRelicQueryResults(rawData.results[0].events);
    }

    // Handle New Relic Logs API response
    if (rawData.data && Array.isArray(rawData.data)) {
      return this.formatNewRelicLogs(rawData.data);
    }

    // Handle New Relic Events API response
    if (rawData.results && Array.isArray(rawData.results)) {
      return this.formatNewRelicEvents(rawData.results);
    }

    // Handle single log entry
    if (rawData.timestamp && (rawData.message || rawData.attributes)) {
      return [this.formatSingleNewRelicEntry(rawData)];
    }

    // Handle array of direct log entries
    if (Array.isArray(rawData)) {
      return rawData.map((entry: any) => this.formatSingleNewRelicEntry(entry));
    }

    return [];
  }

  private formatNewRelicLogs(logs: any[]): UnifiedLogResponse[] {
    return logs.map((log: any) => this.formatSingleNewRelicEntry(log));
  }

  private formatNewRelicEvents(events: any[]): UnifiedLogResponse[] {
    return events.map((event: any) => this.formatSingleNewRelicEntry(event));
  }

  private formatNewRelicQueryResults(events: any[]): UnifiedLogResponse[] {
    return events.map((event: any) => this.formatSingleNewRelicEntry(event));
  }

  private formatSingleNewRelicEntry(entry: any): UnifiedLogResponse {
    const timestamp = this.extractTimestamp(entry);
    const level = this.mapNewRelicLevelToLogLevel(entry);
    const message = this.buildNewRelicMessage(entry);

    return UnifiedLogResponseBuilder.create()
      .withTimestamp(timestamp)
      .withSource("newrelic")
      .withLevel(level)
      .withMessage(message)
      .withMeta({
        // New Relic specific metadata
        entityId: entry.entityId || entry.entity?.id,
        entityName: entry.entityName || entry.entity?.name,
        entityType: entry.entityType || entry.entity?.type,
        accountId: entry.accountId,
        hostname: entry.hostname,
        appName: entry.appName,
        transactionName: entry.transactionName,
        traceId: entry.traceId,
        spanId: entry.spanId,
        logLevel: entry.level || entry.logLevel,
        severity: entry.severity,
        eventType: entry.eventType,
        errorClass: entry.errorClass,
        errorMessage: entry.errorMessage,
        stack: entry.stack,
        duration: entry.duration,
        responseTime: entry.responseTime,
        httpStatusCode: entry.httpStatusCode,
        userAgent: entry.userAgent,
        ipAddress: entry.ipAddress,
        userId: entry.userId,
        sessionId: entry.sessionId,
        attributes: entry.attributes,
        tags: entry.tags,
        // Raw data for debugging
        originalData: entry
      })
      .build();
  }

  private extractTimestamp(entry: any): string {
    // New Relic uses various timestamp fields
    if (entry.timestamp) {
      // Handle Unix timestamp (seconds)
      if (typeof entry.timestamp === 'number') {
        return new Date(entry.timestamp * 1000).toISOString();
      }
      // Handle ISO string
      return new Date(entry.timestamp).toISOString();
    }

    // Alternative timestamp fields
    if (entry.createdAt) {
      return new Date(entry.createdAt).toISOString();
    }

    if (entry.occurredAt) {
      return new Date(entry.occurredAt).toISOString();
    }

    if (entry.updatedAt) {
      return new Date(entry.updatedAt).toISOString();
    }

    // Default to current time
    return new Date().toISOString();
  }

  private mapNewRelicLevelToLogLevel(entry: any): LogLevel {
    // Check various level fields that New Relic might use
    const level = entry.level || entry.logLevel || entry.severity || entry.priority;
    
    if (level) {
      const levelStr = level.toString().toLowerCase();
      
      // Map New Relic levels to our standard levels
      switch (levelStr) {
        case "emergency":
        case "alert":
        case "critical":
        case "error":
        case "fatal":
        case "severe":
          return "error";
        case "warning":
        case "warn":
        case "caution":
          return "warn";
        case "notice":
        case "info":
        case "information":
        case "debug":
        case "trace":
        case "verbose":
        default:
          return "info";
      }
    }

    // Infer level from event type
    if (entry.eventType) {
      const eventType = entry.eventType.toLowerCase();
      if (eventType.includes("error") || eventType.includes("exception")) {
        return "error";
      }
      if (eventType.includes("warning") || eventType.includes("alert")) {
        return "warn";
      }
    }

    // Infer from error fields
    if (entry.errorClass || entry.errorMessage || entry.stack) {
      return "error";
    }

    // Infer from HTTP status codes
    if (entry.httpStatusCode) {
      const statusCode = parseInt(entry.httpStatusCode);
      if (statusCode >= 500) return "error";
      if (statusCode >= 400) return "warn";
    }

    // Infer from response time (slow requests)
    if (entry.responseTime && entry.responseTime > 5000) {
      return "warn";
    }

    return "info";
  }

  private buildNewRelicMessage(entry: any): string {
    // Priority order for message extraction

    // 1. Direct message field
    if (entry.message) {
      return this.sanitizeMessage(entry.message);
    }

    // 2. Error information
    if (entry.errorMessage) {
      const errorClass = entry.errorClass ? `${entry.errorClass}: ` : "";
      return this.sanitizeMessage(`${errorClass}${entry.errorMessage}`);
    }

    // 3. Transaction/Event information
    if (entry.transactionName) {
      const duration = entry.duration ? ` (${entry.duration}ms)` : "";
      const status = entry.httpStatusCode ? ` [${entry.httpStatusCode}]` : "";
      return `Transaction: ${entry.transactionName}${status}${duration}`;
    }

    // 4. Event type with entity information
    if (entry.eventType) {
      const entityInfo = entry.entityName ? ` on ${entry.entityName}` : "";
      return `Event: ${entry.eventType}${entityInfo}`;
    }

    // 5. Entity information
    if (entry.entityName) {
      const entityType = entry.entityType ? ` (${entry.entityType})` : "";
      return `Entity: ${entry.entityName}${entityType}`;
    }

    // 6. Application information
    if (entry.appName) {
      return `Application: ${entry.appName}`;
    }

    // 7. Host information
    if (entry.hostname) {
      return `Host: ${entry.hostname}`;
    }

    // 8. Try to extract from attributes
    if (entry.attributes) {
      if (entry.attributes.message) {
        return this.sanitizeMessage(entry.attributes.message);
      }
      if (entry.attributes.title) {
        return this.sanitizeMessage(entry.attributes.title);
      }
      if (entry.attributes.summary) {
        return this.sanitizeMessage(entry.attributes.summary);
      }
    }

    // 9. Generic fallback with available information
    const parts: string[] = [];
    
    if (entry.level) parts.push(`Level: ${entry.level}`);
    if (entry.accountId) parts.push(`Account: ${entry.accountId}`);
    if (entry.traceId) parts.push(`Trace: ${entry.traceId.substring(0, 8)}...`);
    
    if (parts.length > 0) {
      return parts.join(" | ");
    }

    // 10. Last resort - JSON representation of key fields
    const keyFields = {
      eventType: entry.eventType,
      entityType: entry.entityType,
      level: entry.level
    };
    
    const nonEmptyFields = Object.entries(keyFields)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    if (Object.keys(nonEmptyFields).length > 0) {
      return `New Relic Event: ${JSON.stringify(nonEmptyFields)}`;
    }

    return "New Relic log entry";
  }
}