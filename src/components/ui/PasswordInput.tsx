import { JSX, Show, createSignal, splitProps } from "solid-js";

export interface PasswordInputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
}

export default function PasswordInput(props: PasswordInputProps) {
  const [local, rest] = splitProps(props, ["error", "class", "id"]);
  const [showPassword, setShowPassword] = createSignal(false);

  const inputId = local.id || "password-input";
  const errorId = `${inputId}-error`;

  return (
    <div class="w-full">
      <div class="relative">
        <input
          {...rest}
          id={inputId}
          type={showPassword() ? "text" : "password"}
          aria-invalid={!!local.error}
          aria-describedby={local.error ? errorId : undefined}
          class={`w-full rounded-lg border-2 bg-white px-4 py-2.5 pr-11 text-sm transition-standard focus-ring-flat disabled:cursor-not-allowed disabled:opacity-50 ${
            local.error
              ? "border-red-500"
              : "border-cream-200 hover:border-cream-300 focus:border-forest-500"
          } ${local.class || ""}`}
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center px-3 text-forest-500 hover:text-forest-700"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword() ? "Hide password" : "Show password"}
          tabindex={-1}
        >
          {showPassword() ? "Hide" : "Show"}
        </button>
      </div>
      <Show when={local.error}>
        <p id={errorId} class="mt-1 text-xs font-medium text-red-600" role="alert">
          {local.error}
        </p>
      </Show>
    </div>
  );
}
