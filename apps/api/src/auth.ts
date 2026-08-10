import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { databaseSchema, db } from "./db/client.js";
import { serverEnv } from "./server-env.js";
import { createAliyunSmsOtpSender } from "./sms/aliyun.js";
import { aliyunSmsConfig } from "./sms-env.js";

const phoneNumberPattern = /^\+[1-9]\d{6,14}$/;
const localAuthHosts = new Set(["127.0.0.1", "localhost"]);
const isLocalAuthServer = localAuthHosts.has(
  new URL(serverEnv.BETTER_AUTH_URL).hostname,
);
const sendAliyunSmsOtp = aliyunSmsConfig
  ? createAliyunSmsOtpSender(aliyunSmsConfig)
  : undefined;

export const auth = betterAuth({
  appName: "Bead",
  baseURL: serverEnv.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: databaseSchema,
  }),
  rateLimit: {
    enabled: true,
    customRules: {
      "/phone-number/send-otp": {
        max: 1,
        window: 60,
      },
    },
  },
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: serverEnv.CORS_ORIGINS,
  plugins: [
    phoneNumber({
      allowedAttempts: 3,
      expiresIn: 300,
      phoneNumberValidator: (value) => phoneNumberPattern.test(value),
      sendOTP: async ({ code, phoneNumber: value }) => {
        if (sendAliyunSmsOtp) {
          await sendAliyunSmsOtp({ code, phoneNumber: value });
          return;
        }

        if (!isLocalAuthServer) {
          throw new Error("SMS provider is not configured");
        }

        console.info(`[auth] OTP for ${value}: ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (value) => `${value.slice(1)}@phone.bead.app`,
        getTempName: () => "串珠创作者",
      },
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
