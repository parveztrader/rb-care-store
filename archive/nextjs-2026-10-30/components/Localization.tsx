"use client";

import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState, type ReactNode, type ReactElement } from "react";
import { translateText, type Language } from "@/lib/i18n/translate";

const LanguageContext = createContext<{ language: Language; ready: boolean; setLanguage: (language: Language) => void }>({ language: "en", ready: false, setLanguage: () => {} });
export function LanguageProvider({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `rb_language=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
    try { localStorage.setItem("rb_language", language); } catch { /* Cookies still preserve the preference. */ }
  }, [language]);
  const value = useMemo(() => ({ language, ready, setLanguage }), [language, ready]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, ready, setLanguage } = useLanguage();
  return <div className={`language-toggle${compact ? " compact" : ""}`} role="group" aria-label="Language / भाषा" translate="no">
    <button type="button" lang="en" disabled={!ready} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
    <button type="button" lang="hi" disabled={!ready} aria-pressed={language === "hi"} onClick={() => setLanguage("hi")}>हिन्दी</button>
  </div>;
}

// Translate React-owned presentation nodes, never DOM text or application data.
// Controlled values, option values, names, IDs, URLs and event handlers stay intact.
export function localizeTree(node: ReactNode, language: Language): ReactNode {
  if (typeof node === "string") return translateText(node, language);
  if (Array.isArray(node)) return Children.map(node, child => localizeTree(child, language));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  const props = element.props;
  if (props.translate === "no" || (typeof props.className === "string" && props.className.includes("seller-description"))) return node;
  if (["script", "style", "pre", "textarea"].includes(String(element.type))) {
    // Textarea contents are user data, but its placeholder is still translatable.
    if (element.type !== "textarea") return node;
  }
  const updates: Record<string, unknown> = {};
  for (const attribute of ["placeholder", "aria-label", "title", "alt"]) {
    if (typeof props[attribute] === "string") updates[attribute] = translateText(props[attribute] as string, language);
  }
  if (element.type === "option" && props.value === undefined) {
    const optionText = Children.toArray(props.children as ReactNode).filter(child => typeof child === "string" || typeof child === "number").join("");
    updates.value = optionText;
  }
  if (props.children !== undefined && element.type !== "textarea") updates.children = localizeTree(props.children as ReactNode, language);
  if (props.fallback !== undefined) updates.fallback = localizeTree(props.fallback as ReactNode, language);
  return cloneElement(element, updates);
}
export function Localized({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <>{localizeTree(children, language)}</>;
}
