import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";
// import { Vercel } from "@vercel/sdk";

/**
 * Interface for Vercel log response
 */
interface VercelLogEntry {
  level: string;
  message: string;
  rowId: string;
  source: string;
  timestampInMs: number;
  domain?: string;
  messageTruncated?: boolean;
  requestMethod?: string;
  requestPath?: string;
  responseStatusCode?: number;
}

/**
 * Data fetcher for Vercel logs using the Vercel SDK
 */
export class VercelDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "vercel";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config as any;
    const requiredFields = ["bearerToken", "projectId", "deploymentId"];
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(
        `Vercel config missing required fields: ${missing.join(", ")}`
      );
      return false;
    }

    return true;
  }
  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Vercel configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const bearerToken = this.getConfigValue(orgConfig, "bearerToken") as string;
    const projectId = this.getConfigValue(orgConfig, "projectId") as string;
    const deploymentId = this.getConfigValue(
      orgConfig,
      "deploymentId"
    ) as string; // Now required
    const limit = config.line || 100;

    try {
      // const vercel = new Vercel({
      //   bearerToken,
      // });

      // // Call the Vercel API
      // let result: VercelLogEntry[] = [];
      // try {
      //   const response = await vercel.logs.getRuntimeLogs({
      //     deploymentId,
      //     projectId,
      //   });

      //   // Check if response is a stream or direct result
      //   const respAny = response as any;
      //   if (respAny && typeof respAny[Symbol.asyncIterator] === "function") {
      //     // Handle as async iterable stream
      //     const timeout = Date.now() + 1000; // 30s timeout
      //     for await (const chunk of respAny) {
      //       if (Date.now() > timeout) break; // Prevent hanging
      //       result.push(chunk as VercelLogEntry);
      //       if (result.length >= limit) break;
      //     }
      //   } else if (Array.isArray(response)) {
      //     // If SDK returns an array directly
      //     result = response.slice(0, limit);
      //   } else if (response) {
      //     // If single object, wrap in array
      //     result = [response as VercelLogEntry];
      //   }
      // } catch (e) {
      //   console.error("Error fetching Vercel logs:", e);
      //   return {
      //     success: false,
      //     error: "No logs returned from Vercel API",
      //     metadata: {
      //       projectId,
      //       deploymentId,
      //     },
      //   };
      // }

      return {
        success: true,
        data: [],
        metadata: {
          projectId,
          deploymentId,
          requestedLimit: limit,
          source: "vercel",
          returnedCount: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Vercel fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          projectId,
          deploymentId,
        },
      };
    }
  }
}
