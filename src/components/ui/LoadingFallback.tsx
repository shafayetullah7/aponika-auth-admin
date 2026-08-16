import { Show } from "solid-js";

export function LoadingFallback(props: { fullScreen?: boolean }) {
  const fullScreen = props.fullScreen ?? true;

  return (
    <div
      class={
        fullScreen
          ? "flex min-h-screen items-center justify-center bg-cream-50"
          : "flex h-full min-h-[12rem] items-center justify-center"
      }
    >
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-forest-600 border-t-transparent" />
    </div>
  );
}
