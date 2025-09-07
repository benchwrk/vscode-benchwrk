import type { SourceDataFetcher } from "./BaseSourceDataFetcher";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { CoolifyDataFetcher } from "./CoolifyDataFetcher";
import { SentryDataFetcher } from "./SentryDataFetcher";
import { StripeDataFetcher } from "./StripeDataFetcher";
import { CloudWatchDataFetcher } from "./CloudWatchDataFetcher";
import { GCPDataFetcher } from "./GCPDataFetcher";
import { NewRelicDataFetcher } from "./NewRelicFetcher";
import { VercelDataFetcher } from "./VercelDataFetcher";

/**
 * Factory class for creating source data fetchers
 * Implements the Factory Pattern for better organization and extensibility
 */
export class SourceDataFetcherFactory {
  private static fetchers: Map<LogSource, () => SourceDataFetcher> = new Map([
    ["coolify", () => new CoolifyDataFetcher()],
    ["sentry", () => new SentryDataFetcher()],
    ["stripe", () => new StripeDataFetcher()],
    ["cloudwatch", () => new CloudWatchDataFetcher()],
    ["gcp", () => new GCPDataFetcher()],
    ["newrelic", () => new NewRelicDataFetcher()],
    ["vercel", () => new VercelDataFetcher()],
  ]);

  /**
   * Creates a data fetcher for the specified source
   */
  static createFetcher(source: LogSource): SourceDataFetcher {
    const fetcherFactory = this.fetchers.get(source);

    if (!fetcherFactory) {
      throw new Error(`No data fetcher available for source: ${source}`);
    }

    return fetcherFactory();
  }

  /**
   * Registers a new fetcher for a source type
   */
  static registerFetcher(
    source: LogSource,
    factory: () => SourceDataFetcher
  ): void {
    this.fetchers.set(source, factory);
  }

  /**
   * Gets all available source types
   */
  static getAvailableSources(): LogSource[] {
    return Array.from(this.fetchers.keys());
  }

  /**
   * Checks if a fetcher is available for the given source
   */
  static hasFetcher(source: LogSource): boolean {
    return this.fetchers.has(source);
  }

  /**
   * Gets a list of all registered fetchers with their source types
   */
  static getAllFetchers(): { source: LogSource; fetcher: SourceDataFetcher }[] {
    return Array.from(this.fetchers.entries()).map(([source, factory]) => ({
      source,
      fetcher: factory(),
    }));
  }

  /**
   * Validates if a source configuration is valid for its fetcher
   */
  static async validateSourceConfig(
    source: LogSource,
    config: any
  ): Promise<boolean> {
    try {
      const fetcher = this.createFetcher(source);
      return fetcher.validateConfig(config);
    } catch {
      return false;
    }
  }
}
