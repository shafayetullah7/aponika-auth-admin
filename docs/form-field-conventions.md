# Form field conventions

Aponika Auth uses the same field pattern as Byte Forge for consistent forms across `aponika-auth-frontend` and `aponika-auth-admin`.

## Component

```tsx
import { FieldGroup, Input } from "~/components/ui";
import { copy } from "~/copy";

<FieldGroup
  label={copy.admin.email}
  requirement="required"
  hint={copy.admin.emailHint}
  error={errors().email}
>
  <Input type="email" name="email" />
</FieldGroup>
```

`FieldGroup` lives in `src/components/ui/FieldGroup.tsx` and is exported from `~/components/ui`.

## Requirement values

| Value | UI | Meaning |
|-------|-----|---------|
| `required` | `*` (red) | Must be filled to submit. |
| `optional` | `(Optional)` | May be left empty. |
| `requiredForReview` | `(Required for review)` | Optional for draft; required before a review/submit step. |

Omitting `requirement` defaults to `required`.

## Hints

Hints describe **purpose**, not obligation:

- Good: "The email address for your account."
- Bad: "Optional email…" — use `requirement="optional"` on the label instead.

Validation errors use the `error` prop on `FieldGroup`. On `Input`, pass `error` for border/`aria-invalid` and set `showErrorMessage={false}` when `FieldGroup` already shows the message (avoids duplicate paragraphs).

```tsx
<FieldGroup label={copy.admin.email} error={field.error}>
  <Input error={field.error} showErrorMessage={false} />
</FieldGroup>
```

`PasswordInput` does not render a separate error line — keep `error` on `FieldGroup` only.

## Optional / review markers

Defined in `~/copy/labels.ts` (`optionalLabel`, `requiredForReviewLabel`). Auth frontend uses i18n `common.optional` / `common.requiredForReview` instead.

## Source

Adapted from Byte Forge `byte-forge-frontend-2/docs/form-field-conventions.md`.
