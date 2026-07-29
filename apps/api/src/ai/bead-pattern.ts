import {
  type CanvasSnapshot,
  validateCanvasSnapshot,
} from "@bead/core/canvas-snapshot";
import {
  type CanvasSizeId,
  getCanvasSizeDefinition,
} from "@bead/core/canvas-sizes";
import { getMardColor, mardColors } from "@bead/core/colors";
import { NonRetriableError } from "inngest";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { GPT_VISION, openai } from "../openai/client.js";
import { putObject } from "../storage/s3.js";
import { loadAiImageObject, toDataUrl } from "./image-input.js";
import { beadPatternObjectKey } from "./object-keys.js";

/**
 * PIXL-style compact grid: tiny palette of symbols → exact rows×cols lines.
 * Much more reliable for ≤29 than sparse cell lists or image sampling.
 */
const beadGridModelSchema = z.object({
  palette: z
    .array(
      z.object({
        /** Single character used in `lines` (not "."). */
        symbol: z.string().min(1).max(1),
        /** MARD bead color code, e.g. H7 / F21. */
        code: z.string().min(1),
      }),
    )
    .min(2)
    .max(12),
  /** Exactly `rows` strings, each exactly `cols` long. "." = empty. */
  lines: z.array(z.string()).min(1),
});

function patternPrompt(sizeId: CanvasSizeId) {
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  const beads = rows * cols;
  const isTiny = rows <= 16;

  return [
    "The attached image is already a pixel-art illustration of the subject.",
    `Quantize it into an EXACT ${rows}×${cols} fuse-bead grid (${beads} cells).`,
    "Preserve the subject's identity and distinctive features as much as the bead budget allows.",
    'Return palette symbols and lines only. Use "." for empty/background cells.',
    "Each lines[i] must have exactly the same length as cols.",
    "Pick at most 12 MARD codes in palette; every non-dot character in lines must appear in palette.",
    isTiny
      ? [
          "Budget rules: eyes 1 bead or 2–3 stacked; merge thin accessories into larger shapes;",
          "keep the unique silhouette (e.g. long ear-tails, head shape) even if details simplify;",
          "black outline about 1 bead thick; subject fills most of the grid.",
        ].join(" ")
      : [
          "Simplify thin lines into solid bead blocks; avoid single-bead noise;",
          "major features should stay several beads wide.",
        ].join(" "),
    `Example MARD codes: ${mardColors
      .slice(0, 40)
      .map((c) => c.code)
      .join(", ")}, … (full MARD set allowed).`,
    "Common useful codes: H7 (black), H2/P1 (white), F21 (pink), A8 (gold/yellow).",
  ].join(" ");
}

function gridToSnapshot(
  parsed: z.infer<typeof beadGridModelSchema>,
  rows: number,
  cols: number,
): CanvasSnapshot {
  if (parsed.lines.length !== rows) {
    throw new NonRetriableError(
      `Expected ${rows} grid lines, got ${parsed.lines.length}`,
    );
  }

  const symbolToCode = new Map<string, string>();
  for (const entry of parsed.palette) {
    if (entry.symbol === ".") {
      throw new NonRetriableError('Palette symbol "." is reserved for empty');
    }
    if (!getMardColor(entry.code)) {
      throw new NonRetriableError(`Unknown MARD code in palette: ${entry.code}`);
    }
    if (symbolToCode.has(entry.symbol)) {
      throw new NonRetriableError(`Duplicate palette symbol: ${entry.symbol}`);
    }
    symbolToCode.set(entry.symbol, entry.code);
  }

  const cells: CanvasSnapshot["cells"] = [];

  for (let row = 0; row < rows; row += 1) {
    const line = parsed.lines[row];
    if (line.length !== cols) {
      throw new NonRetriableError(
        `Line ${row} length ${line.length} !== cols ${cols}`,
      );
    }

    for (let col = 0; col < cols; col += 1) {
      const symbol = line[col];
      if (symbol === ".") continue;

      const code = symbolToCode.get(symbol);
      if (!code) {
        throw new NonRetriableError(
          `Unknown symbol "${symbol}" at row ${row} col ${col}`,
        );
      }

      cells.push([row * cols + col, code]);
    }
  }

  return { cells };
}

/**
 * Multimodal model → exact bead grid → CanvasSnapshot JSON.
 * Returns only the object key so Inngest step memoization stays small.
 */
export async function generateBeadPattern({
  jobId,
  imageObjectKey,
  sizeId,
}: {
  jobId: string;
  imageObjectKey: string;
  sizeId: CanvasSizeId;
}) {
  const { rows, cols } = getCanvasSizeDefinition(sizeId);
  const cellCount = rows * cols;
  const image = await loadAiImageObject(imageObjectKey);

  const completion = await openai.chat.completions.parse({
    model: GPT_VISION,
    messages: [
      {
        role: "system",
        content: [
          "You convert a pixel-art subject image into an exact fuse-bead character grid.",
          "Preserve identity; only simplify to fit the bead budget.",
          "Output a tiny symbol palette plus a character grid (PIXL-style).",
          '"." means empty. Every other character must map to a MARD bead code.',
        ].join(" "),
      },
      {
        role: "user",
        content: [
          { type: "text", text: patternPrompt(sizeId) },
          {
            type: "image_url",
            image_url: { url: toDataUrl(image) },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(beadGridModelSchema, "bead_grid"),
  });

  const message = completion.choices[0]?.message;
  if (message?.refusal) {
    throw new NonRetriableError(message.refusal);
  }

  const parsed = message?.parsed;
  if (!parsed) {
    throw new NonRetriableError("Vision model returned no bead grid");
  }

  const snapshot = gridToSnapshot(parsed, rows, cols);

  const issues: { message: string }[] = [];
  validateCanvasSnapshot({
    snapshot,
    cellCount,
    path: [],
    addIssue: (issue) => {
      issues.push(issue);
    },
  });

  if (issues.length > 0) {
    throw new NonRetriableError(
      `Invalid bead pattern: ${issues.map((issue) => issue.message).join("; ")}`,
    );
  }

  if (snapshot.cells.length === 0) {
    throw new NonRetriableError("Bead pattern has no occupied cells");
  }

  const key = beadPatternObjectKey(jobId);
  await putObject(
    key,
    Buffer.from(`${JSON.stringify(snapshot)}\n`, "utf8"),
    "application/json",
  );
  return key;
}
