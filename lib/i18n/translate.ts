import { englishAliases, hindi } from "./dictionary";
export type Language = "en" | "hi";
export const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();
const hindiLower = Object.fromEntries(Object.entries(hindi).map(([key, value]) => [key.toLowerCase(), value]));
export function translateText(text: string, language: Language): string {
  const key = normalizeText(text);
  if (!key) return text;
  const english = englishAliases[key] || key;
  let translated = language === "hi" ? hindi[english] || hindiLower[english.toLowerCase()] : englishAliases[key];
  if (!translated) translated = translateDynamic(english, language);
  if (translated === key) return text;
  return text.slice(0, text.indexOf(text.trimStart())) + translated + text.slice(text.trimEnd().length);
}
function translateDynamic(text: string, language: Language): string {
  const patterns: [RegExp, (match: RegExpMatchArray) => string, (match: RegExpMatchArray) => string][] = [
    [/^(₹[\d,]+) se shuru$/, m => `From ${m[1]}`, m => `${m[1]} से शुरू`],
    [/^From (₹[\d,]+)$/, m => m[0], m => `${m[1]} से शुरू`],
    [/^(\d+) nayi seller request aayi hai\. Team review aur rate pending hai\.$/, m => `${m[1]} new seller requests received. Team review and pricing are pending.`, m => `${m[1]} नई बिक्री रिक्वेस्ट मिली हैं। टीम की समीक्षा और कीमत बाकी है।`],
    [/^(\d+) new seller requests received\. Team review and pricing are pending\.$/, m => m[0], m => `${m[1]} नई बिक्री रिक्वेस्ट मिली हैं। टीम की समीक्षा और कीमत बाकी है।`],
    [/^Add (.+) to cart$/, m => m[0], m => `${m[1]} को कार्ट में जोड़ें`],
    [/^(.+) added to cart$/, m => m[0], m => `${m[1]} कार्ट में जोड़ा गया`],
    [/^Remove photo (\d+)$/, m => m[0], m => `फ़ोटो ${m[1]} हटाएँ`],
    [/^Appliance photo (\d+)$/, m => m[0], m => `उपकरण की फ़ोटो ${m[1]}`],
    [/^(.+), seller photo (\d+)$/, m => m[0], m => `${m[1]}, विक्रेता की फ़ोटो ${m[2]}`],
    [/^(.+) — customer photo$/, m => m[0], m => `${m[1]} — ग्राहक की फ़ोटो`],
    [/^(.+) — (Overview|Front view|Rear view|Inside view|Model label|Controls|Wear and scratches)$/, m => m[0], m => `${hindi[m[1]] || m[1]} — ${hindi[m[2]] || m[2]}`],
    [/^This appliance is available for delivery within (.+)\.$/, m => m[0], m => `इस उपकरण की डिलीवरी ${hindi[m[1]] || m[1]} शहर में उपलब्ध है।`],
    [/^Delete product (.+)\?$/, m => m[0], m => `क्या उपकरण ${m[1]} हटाना चाहते हैं?`],
    [/^String must contain at least (\d+) character\(s\)$/, m => m[0], m => `कम से कम ${m[1]} अक्षर लिखें।`],
    [/^String must contain at most (\d+) character\(s\)$/, m => m[0], m => `अधिकतम ${m[1]} अक्षर लिखें।`],
  ];
  for (const [pattern, en, hi] of patterns) { const match = text.match(pattern); if (match) return language === "hi" ? hi(match) : en(match); }
  if (language === "hi" && text.includes(", ") && text.split(", ").every(part => hindi[part])) return text.split(", ").map(part => hindi[part]).join(", ");
  // Keep symbols and punctuation while translating a known label, e.g. “📦 Inventory”.
  const decorated = text.match(/^([^\p{L}\p{N}]*)(.*?)(\s*[→›↓:,*()]*)$/u);
  if (decorated && decorated[2] && decorated[2] !== text) {
    const source = englishAliases[decorated[2]] || decorated[2];
    const value = language === "hi" ? hindi[source] : source;
    if (value) return decorated[1] + value + decorated[3];
  }
  return text;
}
