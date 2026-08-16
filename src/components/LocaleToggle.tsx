import { useI18n, type Locale } from "~/i18n";

const LOCALE_STORAGE_KEY = "aponika-auth-admin-locale";

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === "en" || saved === "bn" ? saved : null;
}

export function storeLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  const select = (next: Locale) => {
    setLocale(next);
    storeLocale(next);
  };

  return (
    <div
      class="inline-flex rounded-lg border border-cream-200 bg-white p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        class="rounded-md px-2.5 py-1 transition-colors"
        classList={{
          "bg-forest-700 text-white": locale() === "en",
          "text-forest-600 hover:text-forest-800": locale() !== "en",
        }}
        onClick={() => select("en")}
      >
        EN
      </button>
      <button
        type="button"
        class="rounded-md px-2.5 py-1 transition-colors"
        classList={{
          "bg-forest-700 text-white": locale() === "bn",
          "text-forest-600 hover:text-forest-800": locale() !== "bn",
        }}
        onClick={() => select("bn")}
      >
        BN
      </button>
    </div>
  );
}
