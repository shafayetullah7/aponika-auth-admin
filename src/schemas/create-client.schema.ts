import { z } from "zod";

export const OAUTH_SCOPES = ["openid", "profile", "email"] as const;

const clientIdSchema = z
  .string()
  .min(3, "Client ID must be at least 3 characters")
  .max(128, "Client ID is too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only",
  );

export const createClientScalarsSchema = z.object({
  clientId: clientIdSchema,
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  clientType: z.enum(["public", "confidential"]),
  pkceRequired: z.boolean().optional(),
});

export type CreateClientScalarsFormData = z.infer<typeof createClientScalarsSchema>;

export const createClientPayloadSchema = createClientScalarsSchema
  .extend({
    redirectUris: z.array(z.string().min(1, "URI is required")).min(1, "Add at least one redirect URI"),
    postLogoutRedirectUris: z.array(z.string().min(1, "URI is required")).optional(),
    allowedOrigins: z.array(z.string().min(1, "Origin is required")).optional(),
    scopes: z.array(z.string().min(1)).min(1, "Select at least one scope"),
  })
  .superRefine((data, ctx) => {
    if (data.clientType === "public" && data.pkceRequired === false) {
      ctx.addIssue({
        code: "custom",
        message: "Public clients must require PKCE",
        path: ["pkceRequired"],
      });
    }
  });

export type CreateClientPayload = z.infer<typeof createClientPayloadSchema>;

export function trimUriList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function buildCreateClientPayload(input: {
  scalars: CreateClientScalarsFormData;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  allowedOrigins: string[];
  scopes: string[];
}): CreateClientPayload {
  return {
    ...input.scalars,
    description: input.scalars.description?.trim() || undefined,
    redirectUris: trimUriList(input.redirectUris),
    postLogoutRedirectUris: trimUriList(input.postLogoutRedirectUris),
    allowedOrigins: trimUriList(input.allowedOrigins),
    scopes: input.scopes,
    pkceRequired:
      input.scalars.clientType === "public" ? true : input.scalars.pkceRequired ?? true,
  };
}

export function zodIssuesToFieldErrors(
  issues: z.ZodIssue[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  issues.forEach((issue) => {
    if (issue.path.length === 0) return;
    const key = issue.path.join(".");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  });
  return errors;
}
