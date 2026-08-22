import { describe, expect, test } from "bun:test";
import { generateQwenImage } from "./qwen-image.js";

const source = {
  bytes: Uint8Array.from([1, 2, 3]),
  mime: "image/jpeg",
  ext: "jpg",
} as const;

describe("generateQwenImage", () => {
  test("sends a multimodal image request and downloads the generated image", async () => {
    const requests: Request[] = [];
    const image = Uint8Array.from([137, 80, 78, 71]);
    const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      if (requests.length === 1) {
        return Response.json({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://images.example/result.png" }],
                },
              },
            ],
          },
        });
      }
      return new Response(image, { headers: { "content-type": "image/png" } });
    };

    await expect(
      generateQwenImage({
        config: {
          apiKey: "test-key",
          generationUrl:
            "https://workspace.example/api/v1/services/aigc/multimodal-generation/generation",
          model: "qwen-image-3.0-pro",
        },
        source,
        prompt: "make beads",
        fetchFn,
      }),
    ).resolves.toEqual({ bytes: image, contentType: "image/png" });

    expect(requests).toHaveLength(2);
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer test-key");
    expect(await requests[0]?.json()).toEqual({
      model: "qwen-image-3.0-pro",
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: "data:image/jpeg;base64,AQID" },
              { text: "make beads" },
            ],
          },
        ],
      },
      parameters: { prompt_extend: true },
    });
  });

  test("reports Qwen API errors", async () => {
    const fetchFn = async () =>
      Response.json(
        { code: "InvalidApiKey", message: "invalid key" },
        { status: 401 },
      );

    await expect(
      generateQwenImage({
        config: {
          apiKey: "test-key",
          generationUrl: "https://workspace.example/generation",
          model: "qwen-image-3.0-pro",
        },
        source,
        prompt: "make beads",
        fetchFn,
      }),
    ).rejects.toThrow(
      "Qwen image generation failed: HTTP 401 (InvalidApiKey: invalid key)",
    );
  });

  test("rejects successful responses without an image URL", async () => {
    const fetchFn = async () =>
      Response.json({
        output: { choices: [{ message: { content: [{ text: "done" }] } }] },
      });

    await expect(
      generateQwenImage({
        config: {
          apiKey: "test-key",
          generationUrl: "https://workspace.example/generation",
          model: "qwen-image-3.0-pro",
        },
        source,
        prompt: "make beads",
        fetchFn,
      }),
    ).rejects.toThrow("Qwen returned no generated image URL");
  });
});
