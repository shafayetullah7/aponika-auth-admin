import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { I18nContext, createI18n } from "~/i18n";
import "./app.css";

export default function App() {
  const i18n = createI18n("en");

  return (
    <I18nContext.Provider value={i18n}>
      <Router
        root={(props) => (
          <MetaProvider>
            <Title>Aponika Auth Admin</Title>
            <Suspense
              fallback={
                <div class="flex min-h-screen items-center justify-center">
                  <div class="h-8 w-8 animate-spin rounded-full border-2 border-forest-600 border-t-transparent" />
                </div>
              }
            >
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
