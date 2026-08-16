import { createMemo, createUniqueId, JSX, Show, splitProps } from "solid-js";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input(props: InputProps) {
  const [local, others] = splitProps(props, [
    "label",
    "error",
    "class",
    "required",
    "maxLength",
  ]);

  const inputId = createUniqueId();

  const charCount = createMemo(() => {
    const val = props.value ?? "";
    return local.maxLength ? `${String(val).length}/${local.maxLength}` : "";
  });

  const isNearLimit = createMemo(() => {
    const val = props.value ?? "";
    return local.maxLength
      ? Number(local.maxLength) - String(val).length <= 10
      : false;
  });

  const hasCounter = createMemo(() => !!local.maxLength);

  const baseStyles =
    "w-full px-4 py-2.5 rounded-lg border-2 transition-standard focus-ring-flat disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-white";

  const counterStyles =
    "absolute right-3 top-1/2 -translate-y-1/2 text-xs select-none pointer-events-none";

  const stateStyles = local.error
    ? "border-red-500 active:border-red-600"
    : "border-cream-200 hover:border-cream-300 focus:border-forest-500";

  const inputClass = hasCounter()
    ? `${baseStyles} ${stateStyles} pr-20 ${local.class || ""}`
    : `${baseStyles} ${stateStyles} ${local.class || ""}`;

  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    if (local.maxLength) {
      const max = Number(local.maxLength);
      if (target.value.length > max) {
        target.value = target.value.slice(0, max);
      }
    }
  };

  const onInputHandler = (e: Event) => {
    handleInput(e as InputEvent);
    const handler = props.onInput;
    if (typeof handler === "function") {
      handler(
        e as InputEvent & {
          currentTarget: HTMLInputElement;
          target: HTMLInputElement;
        },
      );
    }
  };

  const errorId = `${inputId}-error`;

  return (
    <div class="w-full">
      <Show when={local.label}>
        <label
          for={inputId}
          class="mb-1.5 block text-sm font-medium text-forest-800"
        >
          {local.label}
          <Show when={local.required}>
            <span class="ml-1 text-red-500">*</span>
          </Show>
        </label>
      </Show>
      <div class="relative">
        <input
          id={inputId}
          class={inputClass}
          {...others}
          onInput={onInputHandler}
          aria-invalid={!!local.error}
          aria-describedby={local.error ? errorId : undefined}
        />
        <Show when={hasCounter()}>
          <span
            class={`${counterStyles} ${isNearLimit() ? "text-amber-600" : "text-gray-400"}`}
          >
            {charCount()}
          </span>
        </Show>
      </div>
      <Show when={local.error}>
        <p
          id={errorId}
          class="mt-1 text-xs font-medium text-red-600"
          role="alert"
        >
          {local.error}
        </p>
      </Show>
    </div>
  );
}
