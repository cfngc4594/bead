import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type AliyunSmsConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
};

type AliyunSmsEnvironment = {
  ALIBABA_CLOUD_ACCESS_KEY_ID?: string;
  ALIBABA_CLOUD_ACCESS_KEY_SECRET?: string;
  ALIBABA_CLOUD_SMS_SIGN_NAME?: string;
  ALIBABA_CLOUD_SMS_TEMPLATE_CODE?: string;
};

const smsEnv = createEnv({
  server: {
    ALIBABA_CLOUD_ACCESS_KEY_ID: z.string().min(1).optional(),
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: z.string().min(1).optional(),
    ALIBABA_CLOUD_SMS_SIGN_NAME: z.string().min(1).optional(),
    ALIBABA_CLOUD_SMS_TEMPLATE_CODE: z.string().min(1).optional(),
  },
  clientPrefix: "",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
});

export function resolveAliyunSmsConfig(
  environment: AliyunSmsEnvironment,
): AliyunSmsConfig | undefined {
  const values = {
    ALIBABA_CLOUD_ACCESS_KEY_ID: environment.ALIBABA_CLOUD_ACCESS_KEY_ID,
    ALIBABA_CLOUD_ACCESS_KEY_SECRET:
      environment.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    ALIBABA_CLOUD_SMS_SIGN_NAME: environment.ALIBABA_CLOUD_SMS_SIGN_NAME,
    ALIBABA_CLOUD_SMS_TEMPLATE_CODE:
      environment.ALIBABA_CLOUD_SMS_TEMPLATE_CODE,
  };
  const missingVariables = Object.entries(values)
    .filter(([, value]) => value === undefined)
    .map(([name]) => name);

  if (missingVariables.length === 4) {
    return undefined;
  }

  if (missingVariables.length > 0) {
    throw new Error(
      `Incomplete Alibaba Cloud SMS configuration. Missing: ${missingVariables.join(", ")}`,
    );
  }

  return {
    accessKeyId: requireSmsConfigValue(
      values.ALIBABA_CLOUD_ACCESS_KEY_ID,
      "ALIBABA_CLOUD_ACCESS_KEY_ID",
    ),
    accessKeySecret: requireSmsConfigValue(
      values.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      "ALIBABA_CLOUD_ACCESS_KEY_SECRET",
    ),
    signName: requireSmsConfigValue(
      values.ALIBABA_CLOUD_SMS_SIGN_NAME,
      "ALIBABA_CLOUD_SMS_SIGN_NAME",
    ),
    templateCode: requireSmsConfigValue(
      values.ALIBABA_CLOUD_SMS_TEMPLATE_CODE,
      "ALIBABA_CLOUD_SMS_TEMPLATE_CODE",
    ),
  };
}

function requireSmsConfigValue(value: string | undefined, name: string) {
  if (value === undefined) {
    throw new Error(`Missing Alibaba Cloud SMS configuration: ${name}`);
  }

  return value;
}

export const aliyunSmsConfig = resolveAliyunSmsConfig(smsEnv);
