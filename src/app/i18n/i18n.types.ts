export type Lang = 'bn' | 'en';

/** Arbitrarily-nested string dictionary, e.g. { hero: { title: '...' } }. */
export type Dict = { [key: string]: string | Dict };

/**
 * Every i18n section file exports one of these, namespaced under a single
 * top-level key matching its own section name (e.g. `{ bn: { home: {...} },
 * en: { home: {...} } }`). This is what makes it safe for many different
 * people/agents to add new section files in parallel without ever touching
 * the same file — each section owns its own file AND its own top-level key,
 * so merging them in translations.ts is just a spread, never a conflict.
 */
export interface I18nSection {
  bn: Dict;
  en: Dict;
}
