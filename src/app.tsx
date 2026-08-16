import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount } from "solid-js";
import { readStoredLocale, ADMIN_LOCALE_STORAGE_KEY } from "~/components/LocaleToggle";
import { LoadingFallback } from "~/components/ui";
import { I18nContext, createI18n } from "~/i18n";
import "./app.css";

export default function App() {
  const i18n = createI18n("en");

  onMount(() => {
    const saved = readStoredLocale(ADMIN_LOCALE_STORAGE_KEY);
    if (saved) {
      i18n.setLocale(saved);
    }
  });

  return (
    <I18nContext.Provider value={i18n}>
      <Router
        root={(props) => (
          <MetaProvider>
            <Title>Aponika Auth Admin</Title>
            <Suspense fallback={<LoadingFallback />}>
              {props.children}
            </Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </I18nContext.Provider>
  );
}
