// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://37d3971d8a834f7c95b6148a6171726a@o368956.ingest.sentry.io/6188250",

  // Errors reach Sentry from builds only; a dev server's throwaway failures are not the project's
  // to carry. NODE_ENV is "production" for `next build`, so a locally served build still reports.
  enabled: process.env.NODE_ENV === "production",

  // Tracing is sampled down in production: a trace on every request buys nothing a tenth does not,
  // and the quota is finite. Everything is traced in a build served locally, where volume is one.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Keep user IP address inference disabled unless explicitly opted in.
  sendDefaultPii: false,
});
