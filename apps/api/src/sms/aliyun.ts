import Dysmsapi20170525, { SendSmsRequest } from "@alicloud/dysmsapi20170525";
import { Config } from "@alicloud/openapi-client";
import type { AliyunSmsConfig } from "../sms-env.js";

const e164PhoneNumberPattern = /^\+[1-9]\d{6,14}$/;

export interface AliyunSmsClient {
  sendSms(request: SendSmsRequest): Promise<{
    body?: {
      code?: string;
    };
  }>;
}

type PhoneOtp = {
  code: string;
  phoneNumber: string;
};

export function createAliyunSmsOtpSender(
  config: AliyunSmsConfig,
  client: AliyunSmsClient = createAliyunSmsClient(config),
) {
  return async ({ code, phoneNumber }: PhoneOtp) => {
    const request = new SendSmsRequest({
      phoneNumbers: toAliyunPhoneNumber(phoneNumber),
      signName: config.signName,
      templateCode: config.templateCode,
      templateParam: JSON.stringify({ code }),
    });
    let response: Awaited<ReturnType<AliyunSmsClient["sendSms"]>>;

    try {
      response = await client.sendSms(request);
    } catch (error) {
      throw new Error(
        `Alibaba Cloud SMS request failed with code ${getErrorCode(error)}`,
      );
    }

    if (response.body?.code !== "OK") {
      throw new Error(
        `Alibaba Cloud SMS request failed with code ${response.body?.code ?? "UNKNOWN"}`,
      );
    }
  };
}

function getErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "UNKNOWN";
}

export function toAliyunPhoneNumber(phoneNumber: string) {
  if (!e164PhoneNumberPattern.test(phoneNumber)) {
    throw new Error("Phone number must use E.164 format");
  }

  if (phoneNumber.startsWith("+86")) {
    return phoneNumber.slice(3);
  }

  return phoneNumber.slice(1);
}

function createAliyunSmsClient(config: AliyunSmsConfig) {
  return new Dysmsapi20170525(
    new Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: "dysmsapi.aliyuncs.com",
    }),
  );
}
