import { setError, type FieldValues, type FormStore } from "@modular-forms/solid";
import { ApiError } from "./types";

type FieldMapper = Record<string, string>;

export function applyApiErrorToForm(
  form: FormStore<FieldValues>,
  error: unknown,
  fieldMap: FieldMapper = {},
): string | null {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : "Request failed";
  }

  const data = error.data as
    | { message?: string; error?: { code?: string } }
    | undefined;
  const message = data?.message || error.message;

  if (error.status === 409) {
    setError(form, "clientId", message);
    return null;
  }

  if (error.status === 400) {
    const lower = message.toLowerCase();
    const mappedField = Object.entries(fieldMap).find(([needle]) =>
      lower.includes(needle),
    );

    if (mappedField) {
      setError(form, mappedField[1], message);
      return null;
    }

    if (lower.includes("clientid") || lower.includes("client id")) {
      setError(form, "clientId", message);
      return null;
    }

    if (lower.includes("redirect") || lower.includes("uri") || lower.includes("origin")) {
      return message;
    }
  }

  return message;
}
