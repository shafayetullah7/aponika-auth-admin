import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Button, Card } from "~/components/ui";
import { useI18n } from "~/i18n";

export function ClientSecretReveal(props: {
  clientId: string;
  clientSecret: string;
  detailHref: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = createSignal(false);

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(props.clientSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card class="max-w-2xl space-y-4">
      <h2 class="h5">{t("clientsCreate.secretTitle")}</h2>
      <p class="text-sm text-terracotta-700">{t("clientsCreate.secretWarning")}</p>

      <div class="rounded-xl border-2 border-cream-200 bg-cream-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-forest-600">
          {t("clientsCreate.secretLabel")}
        </p>
        <code class="mt-2 block break-all font-mono text-sm text-forest-900">
          {props.clientSecret}
        </code>
      </div>

      <div class="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={copySecret}>
          {copied() ? t("clientsCreate.secretCopied") : t("clientsCreate.secretCopy")}
        </Button>
        <A href={props.detailHref}>
          <Button type="button">{t("clientsCreate.continueToClient")}</Button>
        </A>
      </div>

      <Show when={copied()}>
        <p class="text-sm text-forest-600" role="status">
          {t("clientsCreate.secretCopied")}
        </p>
      </Show>
    </Card>
  );
}
