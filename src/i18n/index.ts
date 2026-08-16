import {
  createContext,
  createMemo,
  createSignal,
  useContext,
  type Accessor,
} from "solid-js";
import { flatten, resolveTemplate, translator } from "@solid-primitives/i18n";
import * as bn from "./bn";
import * as en from "./en";

export type Locale = "en" | "bn";
export type Translator = (key: string, ...args: (string | number)[]) => string;

export interface I18nContextInterface {
  t: Translator;
  locale: Accessor<Locale>;
  setLocale: (locale: Locale) => void;
}

const dictionaries = { en: en.dict, bn: bn.dict };

export const I18nContext = createContext<I18nContextInterface>();

export function createI18n(initialLocale: Locale = "en"): I18nContextInterface {
  const [locale, setLocale] = createSignal<Locale>(initialLocale);
  const dict = createMemo(() => flatten(dictionaries[locale()]));
  const t = translator(dict, resolveTemplate) as Translator;
  return { t, locale, setLocale };
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nContext.Provider");
  return context;
}
