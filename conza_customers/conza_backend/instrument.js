const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://1e21ced537f6eba8c8f37b0d60c8e60f@o4511522008989696.ingest.us.sentry.io/4511522032648192',
  environment: process.env.NODE_ENV || 'development',
  sendDefaultPii: true,
});