import { JSX, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  footer?: JSX.Element;
}

export function Modal(props: ModalProps) {
  let modalContentRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.show) {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") props.onClose();
      };
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";

      const firstFocusable = modalContentRef?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement | undefined;
      firstFocusable?.focus();

      onCleanup(() => {
        window.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      });
    }
  });

  return (
    <Show when={props.show}>
      <Portal mount={document.body}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            class="absolute inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={props.onClose}
          />

          <div
            ref={modalContentRef!}
            class="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div class="flex flex-shrink-0 items-center justify-between border-b border-cream-200 px-6 py-4">
              <h3 id="modal-title" class="text-lg font-bold text-forest-900">
                {props.title}
              </h3>
              <button
                type="button"
                onClick={props.onClose}
                class="rounded-lg p-2 text-forest-500 transition-standard hover:bg-cream-50 hover:text-forest-800"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">{props.children}</div>

            <Show when={props.footer}>
              <div class="flex flex-shrink-0 items-center justify-end gap-3 border-t border-cream-200 bg-cream-50/80 px-6 py-4">
                {props.footer}
              </div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
