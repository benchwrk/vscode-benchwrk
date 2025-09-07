import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";

/**
 * Data fetcher for Sentry error tracking issues
 */
export class SentryDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "sentry";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config as any;
    const requiredFields = ["projectId", "orgId", "accessKey"];
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(
        `Sentry config missing required fields: ${missing.join(", ")}`
      );
      return false;
    }

    return true;
  }

  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Sentry configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const projectId = this.getConfigValue(orgConfig, "projectId") as string;
    const organizationId = this.getConfigValue(orgConfig, "orgId") as string;
    const accessKey = this.getConfigValue(orgConfig, "accessKey") as string;
    const limit = config.line || 20;

    try {
      const url = new URL(
        `https://sentry.io/api/0/projects/${organizationId}/${projectId}/issues/`
      );
      url.searchParams.set("limit", limit.toString());

      // Add optional query parameters
      if (config.additionalParams?.statsPeriod) {
        url.searchParams.set(
          "statsPeriod",
          config.additionalParams.statsPeriod
        );
      }
      if (config.additionalParams?.query) {
        url.searchParams.set("query", config.additionalParams.query);
      }

      const result = await this.performHttpRequest(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessKey}`,
          "Content-Type": "application/json",
        },
      });

      if (result.success) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            projectId,
            organizationId,
            requestedLimit: limit,
            source: "sentry",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Sentry fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          projectId,
          organizationId,
        },
      };
    }
  }

  /**
   * Fetches specific issue details
   */
  async fetchIssueDetails(
    config: SourceFetchConfig,
    issueId: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Sentry configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const projectId = this.getConfigValue(orgConfig, "projectId") as string;
    const organizationId = this.getConfigValue(orgConfig, "orgId") as string;
    const accessKey = this.getConfigValue(orgConfig, "accessKey") as string;

    try {
      const url = new URL(
        `https://sentry.io/api/0/projects/${organizationId}/${projectId}/issues/${issueId}/`
      );

      const result = await this.performHttpRequest(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessKey}`,
          "Content-Type": "application/json",
        },
      });

      if (result.success) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            projectId,
            organizationId,
            issueId,
            source: "sentry",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Sentry issue fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          projectId,
          organizationId,
          issueId,
        },
      };
    }
  }
}
