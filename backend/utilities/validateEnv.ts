import env from "dotenv";
env.config();

const REQUIRED_ENV = [
  // server config
  "PORT",

  // google service mail
  "GOOGLE_CLIENT_ID",

  // auth token key
  "SECRET_AUTH_TOKEN_KEY",
  "EXPIRES_TOKEN",
  "EXPIRES_REFRESH_TOKEN",

  //cookie
  "NODE_ENV",

  // database key
  "PG_USER",
  "PG_HOST",
  "PG_DATABASE",
  "PG_PASSWORD",
  "PG_PORT",

  //Redis
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "REDIS_TIME_OUT",

  "PATH_SAVE_IMAGE",
  "HOST",
  "CLIENT_URL",
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}
