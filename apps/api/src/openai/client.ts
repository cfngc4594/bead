import OpenAI from "openai";
import { openaiEnv } from "../openai-env.js";

export const openai = new OpenAI({
  apiKey: openaiEnv.OPENAI_API_KEY,
  baseURL: openaiEnv.OPENAI_BASE_URL,
});

export const GPT_IMAGE_2 = "gpt-image-2" as const;

/** Multimodal model for structured small-canvas bead grids. */
export const GPT_VISION = openaiEnv.OPENAI_VISION_MODEL;
