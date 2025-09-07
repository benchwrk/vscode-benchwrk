import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";

/**
 * Data fetcher for Google Cloud Platform logs
 */
export class GCPDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "gcp";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config as any;
    const requiredFields = ["projectId", "serviceAccountKey"];
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(`GCP config missing required fields: ${missing.join(", ")}`);
      return false;
    }

    // Validate service account key format (should be JSON)
    try {
      const serviceAccountKey = this.getConfigValue(
        orgConfig,
        "serviceAccountKey"
      );
      if (typeof serviceAccountKey === "string") {
        JSON.parse(serviceAccountKey);
      }
    } catch {
      console.warn("GCP service account key is not valid JSON");
      return false;
    }

    return true;
  }

  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid GCP configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const projectId = this.getConfigValue(orgConfig, "projectId") as string;
    const serviceAccountKey = this.getConfigValue(
      orgConfig,
      "serviceAccountKey"
    );
    const limit = config.line || 20;

    try {
      // Note: This is a simplified implementation
      // In production, you'd want to use the Google Cloud Logging library
      // and proper authentication with service account

      // Mock GCP Cloud Logging API response
      const mockData = {
        entries: [
          {
            logName: `projects/${projectId}/logs/application`,
            timestamp: new Date().toISOString(),
            severity: "INFO",
            textPayload: "GCP log entry - this would be actual log data",
            resource: {
              type: "gce_instance",
              labels: {
                instance_id: "12345",
                zone: "us-central1-a",
              },
            },
            insertId: "gcp-log-id-123",
          },
        ],
        nextPageToken: null,
      };

      return {
        success: true,
        data: mockData,
        metadata: {
          projectId,
          requestedLimit: limit,
          entriesCount: mockData.entries.length,
          source: "gcp",
          note: "This is a mock implementation. Use Google Cloud Logging library in production.",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `GCP fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          projectId,
          source: "gcp",
        },
      };
    }
  }

  /**
   * Fetches GCP logs with advanced filtering
   */
  async fetchLogsWithFilter(
    config: SourceFetchConfig,
    filter: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid GCP configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const projectId = this.getConfigValue(orgConfig, "projectId") as string;

    // Mock implementation with filter
    const mockData = {
      entries: [
        {
          logName: `projects/${projectId}/logs/filtered`,
          timestamp: new Date().toISOString(),
          severity: "ERROR",
          jsonPayload: {
            message: "Filtered log entry based on criteria",
            filter: filter,
          },
          resource: {
            type: "cloud_function",
            labels: {
              function_name: "my-function",
              region: "us-central1",
            },
          },
        },
      ],
    };

    return {
      success: true,
      data: mockData,
      metadata: {
        projectId,
        filter,
        source: "gcp",
        note: "This is a mock implementation with filtering.",
      },
    };
  }

  /**
   * Fetches GCP metrics
   */
  async fetchMetrics(
    config: SourceFetchConfig,
    metricType: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid GCP configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const projectId = this.getConfigValue(orgConfig, "projectId") as string;

    // Mock Cloud Monitoring metrics
    const mockMetrics = {
      timeSeries: [
        {
          metric: {
            type: metricType,
            labels: {},
          },
          resource: {
            type: "gce_instance",
            labels: {
              instance_id: "12345",
              zone: "us-central1-a",
            },
          },
          points: [
            {
              interval: {
                endTime: new Date().toISOString(),
              },
              value: {
                doubleValue: Math.random() * 100,
              },
            },
          ],
        },
      ],
    };

    return {
      success: true,
      data: mockMetrics,
      metadata: {
        projectId,
        metricType,
        source: "gcp",
        note: "This is a mock implementation for metrics.",
      },
    };
  }
}
