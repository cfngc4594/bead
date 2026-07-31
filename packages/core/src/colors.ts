import { z } from "zod";
import colorSchemeData from "./color-schemes.json";

const identifierSchema = z.string().trim().min(1);
const hexColorSchema = z.custom<`#${string}`>(
  (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value),
  "Expected a six-digit hex color",
);

const beadColorSchema = z
  .object({
    code: identifierSchema,
    hex: hexColorSchema,
  })
  .strict();

const colorSchemeBrandSchema = z
  .object({
    id: identifierSchema,
    name: z.string().trim().min(1),
  })
  .strict();

const colorSchemeSchema = z
  .object({
    id: identifierSchema,
    brandId: identifierSchema,
    variant: z.string().trim().min(1),
    name: z.string().trim().min(1),
    aliases: z.array(identifierSchema).default([]),
    colors: z.array(beadColorSchema).min(1),
  })
  .strict()
  .superRefine((scheme, ctx) => {
    addDuplicateIssues(
      scheme.colors.map((color) => color.code),
      (index) => ["colors", index, "code"],
      "Color codes must be unique within a scheme",
      ctx,
    );
  });

const colorSchemeFileSchema = z
  .object({
    defaultSchemeId: identifierSchema,
    brands: z.array(colorSchemeBrandSchema).min(1),
    schemes: z.array(colorSchemeSchema).min(1),
  })
  .strict()
  .superRefine((file, ctx) => {
    addDuplicateIssues(
      file.brands.map((brand) => brand.id),
      (index) => ["brands", index, "id"],
      "Color scheme brand ids must be unique",
      ctx,
    );

    const brandIds = new Set(file.brands.map((brand) => brand.id));
    const schemeIdentifiers = new Set<string>();

    file.schemes.forEach((scheme, schemeIndex) => {
      if (!brandIds.has(scheme.brandId)) {
        ctx.addIssue({
          code: "custom",
          message: "Color scheme must reference a registered brand",
          path: ["schemes", schemeIndex, "brandId"],
        });
      }

      registerSchemeIdentifier(
        scheme.id,
        ["schemes", schemeIndex, "id"],
        schemeIdentifiers,
        ctx,
      );
      scheme.aliases.forEach((alias, aliasIndex) => {
        registerSchemeIdentifier(
          alias,
          ["schemes", schemeIndex, "aliases", aliasIndex],
          schemeIdentifiers,
          ctx,
        );
      });
    });

    if (!file.schemes.some((scheme) => scheme.id === file.defaultSchemeId)) {
      ctx.addIssue({
        code: "custom",
        message: "Default color scheme must reference a registered scheme",
        path: ["defaultSchemeId"],
      });
    }
  });

export type BeadColor = z.infer<typeof beadColorSchema>;
export type ColorSchemeBrand = z.infer<typeof colorSchemeBrandSchema>;
export type ColorScheme = z.infer<typeof colorSchemeSchema>;

const parsedColorSchemeData = colorSchemeFileSchema.parse(colorSchemeData);

export const colorSchemes: readonly ColorScheme[] =
  parsedColorSchemeData.schemes;
export const colorSchemeBrands: readonly ColorSchemeBrand[] =
  parsedColorSchemeData.brands;
export const DEFAULT_COLOR_SCHEME_ID = parsedColorSchemeData.defaultSchemeId;

const colorSchemesById = new Map(
  colorSchemes.map((scheme) => [scheme.id, scheme] as const),
);
const colorSchemeIdsByAlias = new Map(
  colorSchemes.flatMap((scheme) =>
    scheme.aliases.map((alias) => [alias, scheme.id] as const),
  ),
);
const colorsBySchemeAndCode = new Map(
  colorSchemes.map(
    (scheme) =>
      [
        scheme.id,
        new Map(scheme.colors.map((color) => [color.code, color] as const)),
      ] as const,
  ),
);
const colorIndexesBySchemeAndCode = new Map(
  colorSchemes.map(
    (scheme) =>
      [
        scheme.id,
        new Map(
          scheme.colors.map((color, index) => [color.code, index] as const),
        ),
      ] as const,
  ),
);

export const colorSchemeIdSchema = identifierSchema.transform((id, ctx) => {
  const colorSchemeId = resolveColorSchemeId(id);

  if (!colorSchemeId) {
    ctx.addIssue({ code: "custom", message: "Unknown bead color scheme" });
    return z.NEVER;
  }

  return colorSchemeId;
});

export function getColorScheme(id: string) {
  const colorSchemeId = resolveColorSchemeId(id);
  return colorSchemeId ? colorSchemesById.get(colorSchemeId) : undefined;
}

export function getRequiredColorScheme(id: string) {
  const scheme = getColorScheme(id);

  if (!scheme) {
    throw new Error(`Unknown bead color scheme: ${id}`);
  }

  return scheme;
}

export function getBeadColor(colorSchemeId: string, code: string) {
  const resolvedColorSchemeId = resolveColorSchemeId(colorSchemeId);
  return resolvedColorSchemeId
    ? colorsBySchemeAndCode.get(resolvedColorSchemeId)?.get(code)
    : undefined;
}

export function getBeadColorIndex(colorSchemeId: string, code: string) {
  const resolvedColorSchemeId = resolveColorSchemeId(colorSchemeId);
  return resolvedColorSchemeId
    ? (colorIndexesBySchemeAndCode.get(resolvedColorSchemeId)?.get(code) ?? -1)
    : -1;
}

function resolveColorSchemeId(id: string) {
  if (colorSchemesById.has(id)) {
    return id;
  }

  return colorSchemeIdsByAlias.get(id);
}

function registerSchemeIdentifier(
  identifier: string,
  path: (number | string)[],
  identifiers: Set<string>,
  ctx: z.RefinementCtx,
) {
  if (identifiers.has(identifier)) {
    ctx.addIssue({
      code: "custom",
      message: "Color scheme ids and aliases must be unique",
      path,
    });
  }

  identifiers.add(identifier);
}

function addDuplicateIssues(
  values: readonly string[],
  getPath: (index: number) => (number | string)[],
  message: string,
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value)) {
      ctx.addIssue({ code: "custom", message, path: getPath(index) });
    }

    seen.add(value);
  });
}
