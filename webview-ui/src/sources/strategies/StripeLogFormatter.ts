import {
  UnifiedLogResponse,
  UnifiedLogResponseBuilder,
} from "../dtos/UnifiedLogResponse";
import type { LogSource } from "../dtos/UnifiedLogResponse";
import { BaseLogFormatter } from "./BaseLogFormatter";

export class StripeLogFormatter extends BaseLogFormatter {
  getSource(): LogSource {
    return "stripe";
  }

  format(rawData: any): UnifiedLogResponse[] {
    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData.map((event: any) => {
      const timestamp = new Date(event.created * 1000).toISOString(); // Stripe uses Unix timestamp
      const level = this.mapStripeEventToLogLevel(event.type);
      const message = this.buildStripeMessage(event);

      return UnifiedLogResponseBuilder.create()
        .withTimestamp(timestamp)
        .withSource("stripe")
        .withLevel(level)
        .withMessage(message)
        .withMeta({
          eventId: event.id,
          eventType: event.type,
          livemode: event.livemode,
          apiVersion: event.api_version,
          object: event.data?.object,
          customerId: event.data?.object?.customer,
          amount: event.data?.object?.amount,
          currency: event.data?.object?.currency,
        })
        .build();
    });
  }

  private mapStripeEventToLogLevel(
    eventType: string
  ): "info" | "error" | "warn" {
    if (eventType.includes("failed") || eventType.includes("dispute")) {
      return "error";
    }
    if (
      eventType.includes("warning") ||
      eventType.includes("requires_action")
    ) {
      return "warn";
    }
    return "info";
  }

  private buildStripeMessage(event: any): string {
    const eventType = event.type;
    const object = event.data?.object;

    switch (eventType) {
      case "payment_intent.succeeded":
        return `Payment succeeded for ${
          object?.amount
            ? `$${(object.amount / 100).toFixed(2)}`
            : "unknown amount"
        }`;
      case "payment_intent.payment_failed":
        return `Payment failed for customer ${object?.customer || "unknown"}`;
      case "customer.created":
        return `New customer created: ${object?.email || object?.id}`;
      case "invoice.payment_succeeded":
        return `Invoice payment succeeded: ${object?.id}`;
      case "invoice.payment_failed":
        return `Invoice payment failed: ${object?.id}`;
      default:
        return `${eventType.replace(/[._]/g, " ")} event occurred`;
    }
  }
}
