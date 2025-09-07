import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseSourceDataFetcher } from "./BaseSourceDataFetcher";
import type {
  SourceFetchConfig,
  SourceFetchResult,
} from "./BaseSourceDataFetcher";

/**
 * Data fetcher for Stripe payment events and webhooks
 */
export class StripeDataFetcher extends BaseSourceDataFetcher {
  getSourceType(): LogSource {
    return "stripe";
  }

  validateConfig(config: SourceFetchConfig): boolean {
    const orgConfig = config.source.config as any;
    const requiredFields = ["secretKey"]; // Stripe requires secret key
    const missing = this.validateRequiredFields(orgConfig, requiredFields);

    if (missing.length > 0) {
      console.warn(
        `Stripe config missing required fields: ${missing.join(", ")}`
      );
      return false;
    }

    // Validate secret key format
    const secretKey = orgConfig.secretKey as string;
    if (!secretKey.startsWith("sk_")) {
      console.warn('Stripe secret key should start with "sk_"');
      return false;
    }

    return true;
  }

  async fetchData(config: SourceFetchConfig): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Stripe configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const secretKey = this.getConfigValue(orgConfig, "secretKey") as string;
    const limit = Math.min(config.line || 20, 100); // Stripe API limit

    try {
      // Fetch recent events from Stripe
      const url = new URL("https://api.stripe.com/v1/events");
      url.searchParams.set("limit", limit.toString());

      // Add optional filters
      if (config.additionalParams?.type) {
        url.searchParams.set("type", config.additionalParams.type);
      }
      if (config.additionalParams?.created) {
        url.searchParams.set("created", config.additionalParams.created);
      }

      const result = await this.performHttpRequest(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (result.success) {
        // Extract events from Stripe API response
        const events = result.data?.data || [];
        return {
          ...result,
          data: events,
          metadata: {
            ...result.metadata,
            requestedLimit: limit,
            totalCount:
              result.data?.object === "list" ? result.data.data?.length : 0,
            hasMore: result.data?.has_more || false,
            source: "stripe",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Stripe fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          source: "stripe",
        },
      };
    }
  }

  /**
   * Fetches specific payment intent details
   */
  async fetchPaymentIntent(
    config: SourceFetchConfig,
    paymentIntentId: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Stripe configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const secretKey = this.getConfigValue(orgConfig, "secretKey") as string;

    try {
      const url = new URL(
        `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`
      );

      const result = await this.performHttpRequest(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (result.success) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            paymentIntentId,
            source: "stripe",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Stripe payment intent fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          paymentIntentId,
          source: "stripe",
        },
      };
    }
  }

  /**
   * Fetches customer details
   */
  async fetchCustomer(
    config: SourceFetchConfig,
    customerId: string
  ): Promise<SourceFetchResult> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: "Invalid Stripe configuration",
      };
    }

    const orgConfig = config.source.config as any;
    const secretKey = this.getConfigValue(orgConfig, "secretKey") as string;

    try {
      const url = new URL(`https://api.stripe.com/v1/customers/${customerId}`);

      const result = await this.performHttpRequest(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (result.success) {
        return {
          ...result,
          metadata: {
            ...result.metadata,
            customerId,
            source: "stripe",
          },
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Stripe customer fetch error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        metadata: {
          customerId,
          source: "stripe",
        },
      };
    }
  }
}
