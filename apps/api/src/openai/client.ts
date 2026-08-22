import { OpenAI } from "openai";
import { getOpenAiImageConfig } from "../ai/image-provider-env.js";

export function createOpenAiImageClient() {
  const config = getOpenAiImageConfig();
  return {
    model: config.model,
    openai: new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL }),
  };
}
