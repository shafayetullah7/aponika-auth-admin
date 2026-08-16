import { z } from "zod";
import { trimUriList, zodIssuesToFieldErrors } from "./create-client.schema";

export const updateClientFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  redirectUris: z
    .array(z.string().min(1, "URI is required"))
    .min(1, "Add at least one redirect URI"),
  postLogoutRedirectUris: z.array(z.string().min(1, "URI is required")).optional(),
  allowedOrigins: z.array(z.string().min(1, "Origin is required")).optional(),
  scopes: z.array(z.string().min(1)).min(1, "Select at least one scope"),
  pkceRequired: z.boolean().optional(),
});

export type UpdateClientFormData = z.infer<typeof updateClientFormSchema>;

export function buildUpdateClientPayload(input: {
  name: string;
  description?: string;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  allowedOrigins: string[];
  scopes: string[];
  pkceRequired?: boolean;
  isPublic: boolean;
}) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    redirectUris: trimUriList(input.redirectUris),
    postLogoutRedirectUris: trimUriList(input.postLogoutRedirectUris),
    allowedOrigins: trimUriList(input.allowedOrigins),
    scopes: input.scopes,
    pkceRequired: input.isPublic ? true : input.pkceRequired ?? true,
  };
}

export { zodIssuesToFieldErrors };
