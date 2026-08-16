import { JSX, Show, splitProps } from "solid-js";
import type { IconProps } from "./types";

interface SvgIconProps extends IconProps {
  children: JSX.Element;
  viewBox?: string;
}

export default function SvgIcon(props: SvgIconProps) {
  const [local, rest] = splitProps(props, ["class", "title", "children", "viewBox"]);

  return (
    <svg
      {...rest}
      class={local.class ?? "size-5"}
      fill="none"
      stroke="currentColor"
      viewBox={local.viewBox ?? "0 0 24 24"}
      aria-hidden={local.title ? undefined : true}
      role={local.title ? "img" : undefined}
    >
      <Show when={local.title}>
        <title>{local.title}</title>
      </Show>
      {local.children}
    </svg>
  );
}
