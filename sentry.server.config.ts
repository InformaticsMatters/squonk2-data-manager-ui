import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || "https://37d3971d8a834f7c95b6148a6171726a@o368956.ingest.sentry.io/6188250",
  tracesSampleRate: 1.0,
  enabled: !!process.env.SENTRY_AUTH_TOKEN,
});
