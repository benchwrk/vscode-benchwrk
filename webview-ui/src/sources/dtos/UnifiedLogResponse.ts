import { v4 as uuidv4 } from "uuid";

export type LogLevel = "info" | "error" | "warn";
export type LogSource =
  | "coolify"
  | "sentry"
  | "stripe"
  | "cloudwatch"
  | "gcp"
  | "newrelic"
  | "vercel";

export interface UnifiedLogResponseData {
  id: string;
  timestamp: string;
  source: LogSource;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
}

export class UnifiedLogResponse {
  public readonly id: string;
  public readonly timestamp: string;
  public readonly source: LogSource;
  public readonly level: LogLevel;
  public readonly message: string;
  public readonly meta?: Record<string, any>;

  constructor(data: UnifiedLogResponseData) {
    this.id = data.id;
    this.timestamp = data.timestamp;
    this.source = data.source;
    this.level = data.level;
    this.message = data.message;
    this.meta = data.meta;
  }

  toJSON(): UnifiedLogResponseData {
    return {
      id: this.id,
      timestamp: this.timestamp,
      source: this.source,
      level: this.level,
      message: this.message,
      meta: this.meta,
    };
  }

  toString(): string {
    const timestamp = new Date(this.timestamp).toLocaleString();
    const levelDisplay = this.level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${levelDisplay} [${this.source}] ${this.message}`;
  }
}

export class UnifiedLogResponseBuilder {
  private data: Partial<UnifiedLogResponseData> = {};

  static create(): UnifiedLogResponseBuilder {
    return new UnifiedLogResponseBuilder();
  }

  withId(id?: string): this {
    this.data.id = id || uuidv4();
    return this;
  }

  withTimestamp(timestamp?: string): this {
    this.data.timestamp = timestamp || new Date().toISOString();
    return this;
  }

  withSource(source: LogSource): this {
    this.data.source = source;
    return this;
  }

  withLevel(level: LogLevel): this {
    this.data.level = level;
    return this;
  }

  withMessage(message: string): this {
    this.data.message = message;
    return this;
  }

  withMeta(meta: Record<string, any>): this {
    this.data.meta = meta;
    return this;
  }

  build(): UnifiedLogResponse {
    if (!this.data.source || !this.data.level || !this.data.message) {
      throw new Error(
        "Missing required fields: source, level, and message are required"
      );
    }

    return new UnifiedLogResponse({
      id: this.data.id || uuidv4(),
      timestamp: this.data.timestamp || new Date().toISOString(),
      source: this.data.source,
      level: this.data.level,
      message: this.data.message,
      meta: this.data.meta,
    });
  }
}
