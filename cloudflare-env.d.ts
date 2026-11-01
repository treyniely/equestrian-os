declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    EO_RECORD_AI_ENABLED?: string;
    OPENAI_RECORD_MODEL?: string;
    STRIPE_BILLING_ENABLED?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_CONNECT_CLIENT_ID?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    BUCKET?: R2Bucket;
  }
}
