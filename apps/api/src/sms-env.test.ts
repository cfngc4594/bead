import { describe, expect, test } from "bun:test";
import { resolveAliyunSmsConfig } from "./sms-env.js";

describe("Alibaba Cloud SMS environment", () => {
  test("allows SMS configuration to be omitted", () => {
    expect(resolveAliyunSmsConfig({})).toBeUndefined();
  });

  test("returns a complete SMS configuration", () => {
    expect(
      resolveAliyunSmsConfig({
        ALIBABA_CLOUD_ACCESS_KEY_ID: "access-key-id",
        ALIBABA_CLOUD_ACCESS_KEY_SECRET: "access-key-secret",
        ALIBABA_CLOUD_SMS_SIGN_NAME: "Bead",
        ALIBABA_CLOUD_SMS_TEMPLATE_CODE: "SMS_123456",
      }),
    ).toEqual({
      accessKeyId: "access-key-id",
      accessKeySecret: "access-key-secret",
      signName: "Bead",
      templateCode: "SMS_123456",
    });
  });

  test("rejects partially configured SMS credentials", () => {
    expect(() =>
      resolveAliyunSmsConfig({
        ALIBABA_CLOUD_ACCESS_KEY_ID: "access-key-id",
      }),
    ).toThrow("Incomplete Alibaba Cloud SMS configuration");
  });
});
