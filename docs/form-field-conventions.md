# Form field conventions

Aponika Auth uses the same field pattern as Byte Forge for consistent forms across `aponika-auth-frontend` and `aponika-auth-admin`.

## Component

```tsx
import { FieldGroup, Input } from "~/components/ui";

<FieldGroup
  label={t("auth.email")}
  requirement="required"
  hint={t("auth.emailHint")}
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

Validation errors use the `error` prop and replace the hint while visible.

## i18n keys

```ts
common.optional           // "Optional" / "ঐচ্ছিক"
common.requiredForReview  // "Required for review" / "রিভিউর জন্য প্রয়োজন"
```

Add per-form `validation.*` messages for error text; keep hints free of requirement language.

## Source

Adapted from Byte Forge `byte-forge-frontend-2/docs/form-field-conventions.md`.
