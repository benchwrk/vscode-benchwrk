import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";

/**
 * Data fetcher for New Relic logs using GraphQL API
 */
export class NewRelicDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "newrelic";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config;
    const requiredFields = ["accountNumber", "apiKey"];
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(
        `New Relic config missing required fields: ${missing.join(", ")}`
      );
      return false;
    }

    return true;
  }

  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid New Relic configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const accountNumber = this.getConfigValue(
      orgConfig,
      "accountNumber"
    ) as string;
    const apiKey = this.getConfigValue(orgConfig, "apiKey") as string;
    const limit = config.line || 5;
    const timeRange = config.additionalParams?.timeRange || "30 minutes ago";
    const customQuery = config.additionalParams?.query;

    try {
      const nrqlQuery = customQuery
        ? customQuery
        : `SELECT * FROM Log SINCE ${timeRange} LIMIT ${limit}`;

      const graphqlQuery = {
        query: `{
          actor {
            account(id: ${accountNumber}) {
              nrql(query: "${nrqlQuery}") {
                results
              }
            }
          }
        }`,
      };

      const url = new URL("https://api.newrelic.com/graphql");

      const result = await this.performHttpRequest(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-Key": apiKey,
        },
        body: JSON.stringify(graphqlQuery),
      });

      if (result.success) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            accountNumber,
            requestedLimit: limit,
            timeRange,
            query: nrqlQuery,
            source: "newrelic",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `New Relic fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          accountNumber,
          query: customQuery,
        },
      };
    }
  }

  /**
   * Fetches custom NRQL query results
   */
  async fetchCustomQuery(
    config: SourceFetchConfig,
    nrqlQuery: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid New Relic configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const accountNumber = this.getConfigValue(
      orgConfig,
      "accountNumber"
    ) as string;
    const apiKey = this.getConfigValue(orgConfig, "apiKey") as string;

    try {
      const graphqlQuery = {
        query: `{
          actor {
            account(id: ${accountNumber}) {
              nrql(query: "${nrqlQuery}") {
                results
              }
            }
          }
        }`,
      };

      const url = new URL("https://api.newrelic.com/graphql");

      const result = await this.performHttpRequest(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-Key": apiKey,
        },
        body: JSON.stringify(graphqlQuery),
      });

      if (result.success) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            accountNumber,
            query: nrqlQuery,
            source: "newrelic",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `New Relic custom query error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          accountNumber,
          query: nrqlQuery,
        },
      };
    }
  }
}
