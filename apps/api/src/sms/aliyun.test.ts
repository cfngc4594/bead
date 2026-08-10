import { describe, expect, test } from "bun:test";
import type { AliyunSmsConfig } from "../sms-env.js";
import {
  type AliyunSmsClient,
  createAliyunSmsOtpSender,
  toAliyunPhoneNumber,
} from "./aliyun.js";

const config: AliyunSmsConfig = {
  accessKeyId: "access-key-id",
  accessKeySecret: "access-key-secret",
  signName: "Bead",
  templateCode: "SMS_123456",
};

describe("Alibaba Cloud SMS", () => {
  test("formats E.164 phone numbers for the SMS API", () => {
    expect(toAliyunPhoneNumber("+8613800138000")).toBe("13800138000");
    expect(toAliyunPhoneNumber("+85261234567")).toBe("85261234567");
    expect(() => toAliyunPhoneNumber("13800138000")).toThrow(
      "Phone number must use E.164 format",
    );
  });

  test("sends the OTP with the configured signature and template", async () => {
    let request: Parameters<AliyunSmsClient["sendSms"]>[0] | undefined;
    const client: AliyunSmsClient = {
      sendSms: async (value) => {
        request = value;
        return { body: { code: "OK" } };
      },
    };
    const sendOtp = createAliyunSmsOtpSender(config, client);

    await sendOtp({ code: "123456", phoneNumber: "+8613800138000" });

    expect(request?.phoneNumbers).toBe("13800138000");
    expect(request?.signName).toBe("Bead");
    expect(request?.templateCode).toBe("SMS_123456");
    expect(request?.templateParam).toBe('{"code":"123456"}');
  });

  test("rejects non-successful business responses", async () => {
    const client: AliyunSmsClient = {
      sendSms: async () => ({ body: { code: "isv.BUSINESS_LIMIT_CONTROL" } }),
    };
    const sendOtp = createAliyunSmsOtpSender(config, client);

    expect(
      sendOtp({ code: "123456", phoneNumber: "+8613800138000" }),
    ).rejects.toThrow("isv.BUSINESS_LIMIT_CONTROL");
  });

  test("does not expose request details from SDK errors", async () => {
    const client: AliyunSmsClient = {
      sendSms: async () => {
        throw new Error("failed to send code 123456 to 13800138000");
      },
    };
    const sendOtp = createAliyunSmsOtpSender(config, client);

    const request = sendOtp({
      code: "123456",
      phoneNumber: "+8613800138000",
    });

    expect(request).rejects.toThrow(
      "Alibaba Cloud SMS request failed with code UNKNOWN",
    );
    expect(request).rejects.not.toThrow("123456");
    expect(request).rejects.not.toThrow("13800138000");
  });
});
