import { JSX, Show, splitProps } from "solid-js";

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "tinted";
  title?: string;
  description?: string;
}

export default function Card(props: CardProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "class",
    "title",
    "description",
    "children",
  ]);

  const variant = local.variant || "default";

  const baseStyles =
    "flat-card transition-standard rounded-2xl bg-white shadow-sm";

  const variantStyles = {
    default: "border border-cream-200",
    bordered: "border-2 border-cream-200 hover:border-forest-300",
    tinted: "border-transparent bg-forest-50",
  };

  const classes = `${baseStyles} ${variantStyles[variant]} p-6 ${local.class || ""}`;

  return (
    <div class={classes} {...others}>
      <Show when={local.title}>
        <h3 class="h5 mb-2">{local.title}</h3>
      </Show>
      <Show when={local.description}>
        <p class="body-small mb-4 text-forest-700/70">{local.description}</p>
      </Show>
      {local.children}
    </div>
  );
}
