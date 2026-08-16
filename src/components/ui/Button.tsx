import { JSX, Show, splitProps } from "solid-js";
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export default function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "class",
    "children",
    "loading",
  ]);

  const variant = local.variant || "primary";
  const size = local.size || "md";
  const classes = `${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${local.class || ""}`;

  return (
    <button class={classes} disabled={local.loading || props.disabled} {...others}>
      <Show when={local.loading}>
        <svg
          class="mr-2 h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </Show>
      {local.children}
    </button>
  );
}
