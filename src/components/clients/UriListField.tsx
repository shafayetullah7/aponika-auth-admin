import { For, Show } from "solid-js";
import { Button, FieldGroup, Input } from "~/components/ui";
import { copy } from "~/copy";

export function UriListField(props: {
  label: string;
  requirement?: "required" | "optional";
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const updateAt = (index: number, value: string) => {
    const next = [...props.values];
    next[index] = value;
    props.onChange(next);
  };

  const addRow = () => {
    props.onChange([...props.values, ""]);
  };

  const removeAt = (index: number) => {
    if (props.values.length <= 1) {
      props.onChange([""]);
      return;
    }
    props.onChange(props.values.filter((_, i) => i !== index));
  };

  return (
    <FieldGroup
      label={props.label}
      requirement={props.requirement}
      hint={props.hint}
      error={props.error}
    >
      <div class="space-y-2">
        <For each={props.values}>
          {(value, index) => (
            <div class="flex gap-2">
              <Input
                class="flex-1"
                value={value}
                placeholder={props.placeholder}
                disabled={props.disabled}
                onInput={(event) => updateAt(index(), event.currentTarget.value)}
              />
              <Show when={props.values.length > 1 || value.length > 0}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.disabled}
                  onClick={() => removeAt(index())}
                >
                  −
                </Button>
              </Show>
            </div>
          )}
        </For>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="px-0"
          disabled={props.disabled}
          onClick={addRow}
        >
          + {copy.clientsCreate.addUri}
        </Button>
      </div>
    </FieldGroup>
  );
}
