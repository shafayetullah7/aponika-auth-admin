import { For } from "solid-js";
import type { Component } from "solid-js";
import SvgIcon from "./SvgIcon";
import { iconStroke } from "./icon-stroke";
import type { IconProps } from "./types";

export interface StrokeIconPath {
  d: string;
}

export function createStrokeIcon(
  paths: StrokeIconPath[],
): Component<IconProps> {
  const Icon: Component<IconProps> = (props) => (
    <SvgIcon class={props.class} title={props.title}>
      <For each={paths}>
        {(path) => <path {...iconStroke} d={path.d} />}
      </For>
    </SvgIcon>
  );

  return Icon;
}
