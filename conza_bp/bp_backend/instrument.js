const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://59b306378079331d0a06b1f3213543c0@o4511522008989696.ingest.us.sentry.io/4511522071773184',
  environment: process.env.NODE_ENV || 'development',
  sendDefaultPii: true,
});