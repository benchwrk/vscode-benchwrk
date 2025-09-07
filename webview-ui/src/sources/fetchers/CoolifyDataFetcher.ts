import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";

/**
 * Data fetcher for Coolify container logs
 */
export class CoolifyDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "coolify";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config as any;
    const requiredFields = ["server", "appId", "accessKey"];
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(
        `Coolify config missing required fields: ${missing.join(", ")}`
      );
      return false;
    }

    // Validate server URL format
    try {
      new URL(orgConfig.server);
    } catch {
      console.warn("Coolify config has invalid server URL");
      return false;
    }

    return true;
  }

  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Coolify configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const appId = this.getConfigValue(orgConfig, "appId") as string;
    const accessKey = this.getConfigValue(orgConfig, "accessKey") as string;
    const serverUrl = this.getConfigValue(orgConfig, "server") as string;
    const lines = config.line || 20;

    try {
      const url = new URL(serverUrl);
      url.pathname = `/api/v1/applications/${appId}/logs`;
      url.searchParams.set("lines", lines.toString());

      const result = await this.performHttpRequest(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessKey}`,
          "Content-Type": "application/json",
        },
      });

      if (result.success) {
        // Extract logs from Coolify API response structure
        const logs = result.data?.logs || result.data;
        return {
          ...result,
          data: logs,
          metadata: {
            ...result.metadata,
            appId,
            requestedLines: lines,
            source: "coolify",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Coolify fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          appId,
          serverUrl,
        },
      };
    }
  }
}
