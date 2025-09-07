import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

/**
 * Data fetcher for AWS CloudWatch logs and events
 */
export class CloudWatchDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "cloudwatch";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config as any;
    const requiredFields = ["accessKeyId", "secretAccessKey", "region"];
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(
        `CloudWatch config missing required fields: ${missing.join(", ")}`
      );
      return false;
    }

    return true;
  }

  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid CloudWatch configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const accessKeyId = this.getConfigValue(orgConfig, "accessKeyId") as string;
    const secretAccessKey = this.getConfigValue(
      orgConfig,
      "secretAccessKey"
    ) as string;
    const region = this.getConfigValue(orgConfig, "region") as string;
    const logGroupName = this.getConfigValue(
      orgConfig,
      "logGroupName"
    ) as string;
    const limit = config.line || 20;

    try {
      const client = new CloudWatchLogsClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const command = new FilterLogEventsCommand({
        logGroupName,
        limit,
      });

      const response = await client.send(command);
      // console.log("CloudWatch response:", response);
      return {
        success: true,
        data: response,
        metadata: {
          accessKeyId: accessKeyId.substring(0, 8) + "...",
          region,
          logGroupName,
          requestedLimit: limit,
          source: "cloudwatch",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `CloudWatch fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          region,
          logGroupName,
          source: "cloudwatch",
        },
      };
    }
  }

  /**
   * Fetches CloudWatch metrics
   */
  async fetchMetrics(
    config: SourceFetchConfig,
    metricName: string,
    namespace: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid CloudWatch configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const accessKeyId = this.getConfigValue(orgConfig, "accessKeyId") as string;
    const secretAccessKey = this.getConfigValue(
      orgConfig,
      "secretAccessKey"
    ) as string;
    const region = this.getConfigValue(orgConfig, "region") as string;

    try {
      const client = new CloudWatchClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const command = new GetMetricDataCommand({
        MetricDataQueries: [
          {
            Id: "metric1",
            MetricStat: {
              Metric: {
                MetricName: metricName,
                Namespace: namespace,
              },
              Period: 300,
              Stat: "Average",
            },
          },
        ],
        StartTime: new Date(Date.now() - 3600000), // Last hour
        EndTime: new Date(),
      });

      const response = await client.send(command);

      return {
        success: true,
        data: response,
        metadata: {
          metricName,
          namespace,
          source: "cloudwatch",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `CloudWatch metrics fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          metricName,
          namespace,
          source: "cloudwatch",
        },
      };
    }
  }
}
