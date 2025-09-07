import type { LogFormatterStrategy } from "./BaseLogFormatter";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { CoolifyLogFormatter } from "./CoolifyLogFormatter";
import { SentryLogFormatter } from "./SentryLogFormatter";
import { StripeLogFormatter } from "./StripeLogFormatter";
import { CloudWatchLogFormatter } from "./CloudWatchLogFormatter";
import { GCPLogFormatter } from "./GCPLogFormatter";
import { NewRelicFormatter } from "./NewRelicFormatter";
import { VercelLogFormatter } from "./VercelLogFormatter";

/**
 * Factory class for creating log formatters based on source type
 * Implements the Factory Pattern for better organization and extensibility
 */
export class LogFormatterFactory {
  private static formatters: Map<LogSource, () => LogFormatterStrategy> =
    new Map([
      ["coolify", () => new CoolifyLogFormatter()],
      ["sentry", () => new SentryLogFormatter()],
      ["stripe", () => new StripeLogFormatter()],
      ["cloudwatch", () => new CloudWatchLogFormatter()],
      ["gcp", () => new GCPLogFormatter()],
      ["newrelic", () => new NewRelicFormatter()],
      ["vercel", () => new VercelLogFormatter()],
    ]);

  /**
   * Creates a log formatter for the specified source
   */
  static createFormatter(source: LogSource): LogFormatterStrategy {
    const formatterFactory = this.formatters.get(source);

    if (!formatterFactory) {
      throw new Error(`No formatter available for source: ${source}`);
    }

    return formatterFactory();
  }

  /**
   * Registers a new formatter for a source type
   */
  static registerFormatter(
    source: LogSource,
    factory: () => LogFormatterStrategy
  ): void {
    this.formatters.set(source, factory);
  }

  /**
   * Gets all available source types
   */
  static getAvailableSources(): LogSource[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Checks if a formatter is available for the given source
   */
  static hasFormatter(source: LogSource): boolean {
    return this.formatters.has(source);
  }
}
