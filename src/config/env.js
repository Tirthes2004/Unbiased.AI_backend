import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["PORT", "CLIENT_URL", "ML_API_URL", "NODE_ENV"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL,
  mlApiUrl: process.env.ML_API_URL,
  nodeEnv: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === "production",
};
