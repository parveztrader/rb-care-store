# Website languages

English is the default. The storefront header and admin area provide English / हिन्दी buttons. The chosen language is stored in the `rb_language` first-party cookie for one year and mirrored in localStorage. The root layout reads the cookie so full page loads render the chosen language on the server; the client context updates in place when switching without clearing form state.

`lib/i18n/dictionary.ts` contains authored English-to-Hindi translations. `lib/i18n/translate.ts` handles dynamic labels and existing legacy wording. `components/Localization.tsx` translates React presentation trees; it does not rewrite DOM text or change inventory data. Page and client-component output uses the `Localized` boundary.

Translation applies to visible text, placeholders, accessible labels, titles and image descriptions. Option values are kept in their original form so translated categories, cities and statuses submit canonical backend values. IDs, prices, URLs, event handlers, controlled field values and uploaded files stay unchanged. Customer descriptions and content marked `translate="no"` are preserved. Brand and model identifiers remain identifiable. Add new UI copy to the dictionary when adding screens.

Policy, FAQ and warranty wording was translated as existing content, without changing its commercial terms. Language preference is independent of cart and seller tracking secrets.

Run `npm test` for form-value preservation, private-content preservation, dynamic-message and workflow checks. Browser QA should include switching with a partially completed form, navigating to another page, refreshing, choosing filters in Hindi, and returning to English.
