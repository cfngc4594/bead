import { OpenAI } from "openai";
import { openaiEnv } from "../openai-env.js";

export const openai = new OpenAI({
  apiKey: openaiEnv.OPENAI_API_KEY,
  baseURL: openaiEnv.OPENAI_BASE_URL,
});

export const imageModel = openaiEnv.OPENAI_IMAGE_MODEL;
