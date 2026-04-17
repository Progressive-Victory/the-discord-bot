import { FluentBundle, FluentResource } from "@fluent/bundle";
import { Collection } from "discord.js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { i18nOptions } from "./interface";
import { LocaleBundle } from "./locale";
import { Locale, LocalizationMap, fluentVariables } from "./types";

/**
 * Manages localization logic for the PV bot. Includes:
 * <ul>
 *     <li>Utilities to manage the set of supported locales</li>
 *     <li>Utilities to register {@link FluentBundle}s with a locale</li>
 * </ul>
 * @see https://projectfluent.org/fluent.js/index.html
 */
export class i18n {
  /**
   * the fallback if presented locale is not present
   */
  private _fallbackLocale?: Locale;

  /**
   * The global resource used in the case of Markdown
   */
  private global?: FluentResource;

  /**
   * locales to call from
   */
  private locales = new Collection<Locale, LocaleBundle>();

  constructor(options?: i18nOptions) {
    if (options) {
      if (options.fallbackLocale) this._fallbackLocale = options.fallbackLocale;
      if (options.globalResource) this.global = options.globalResource;
    }
  }

  /**
   * @returns the fallback {@link Locale}
   */
  get fallbackLocale() {
    return this._fallbackLocale;
  }

  /**
   * @returns the {@link LocaleBundle} of the fallback locale
   */
  getFallbackLocale() {
    if (this._fallbackLocale == undefined)
      throw Error("fallbackLocale not set");
    return this.getLocale(this._fallbackLocale);
  }

  /**
   * Set the global resource file
   * @param filePath - file path to the file in question
   * @returns the modified {@link i18n} instance
   */
  setGlobalResource(filePath: string) {
    // get file
    const file = readFileSync(join(filePath, "global.ftl"), {
      encoding: "utf-8",
    });
    // resolve file
    this.global = new FluentResource(file);
    return this;
  }

  /**
   * Sets the locales of the {@link i18n} instance
   * @param filePath - the path to the {@link FluentBundle} specifications
   * @param locale - the {@link Locale} to register the {@link FluentBundle} specifications with
   * @returns the instance of {@link i18n} with the {@link i18n#setGlobalResource} method removed
   */
  setLocale(filePath: string, locale: Locale) {
    // get files
    const files = readdirSync(filePath).filter((file) => file.endsWith(".ftl"));

    const local = new LocaleBundle(this, locale);

    // for each of the files creates a new FluentBundle
    for (const file of files) {
      const bundle = new FluentBundle(locale);
      const resource = new FluentResource(
        readFileSync(join(filePath, file), { encoding: "utf-8" }),
      );
      // gets bundle's name from file name
      const bundleName = file.slice(0, -4);

      // adds globals if present
      if (this.global) bundle.addResource(this.global);
      bundle.addResource(resource);

      local.addBundle(bundleName, bundle);
    }

    // Adds locale to  collection
    this.locales.set(locale, local);
    return this as Omit<i18n, "setGlobalResource">;
  }

  /**
   * @param locale - the {@link Locale} to retrieve the {@link LocaleBundle} for
   * @returns the {@link LocaleBundle} corresponding to the specified {@link Locale}
   */
  getLocale(locale: Locale) {
    const hasLocale = this.locales.has(locale);
    const hasFallbackLocale = this._fallbackLocale
      ? this.locales.has(this._fallbackLocale)
      : false;
    let returnLocale: Locale;

    // Return requested locale
    if (hasLocale) returnLocale = locale;
    // Return fallback locale
    else if (this._fallbackLocale && hasFallbackLocale)
      returnLocale = this._fallbackLocale;
    // Throw if fallback is not set
    else if (!this._fallbackLocale) throw Error("Fallback Locale not set");
    // Throw if fallback is present but not added
    else throw Error("Fallback Locale not added to i18n");

    return this.locales.get(returnLocale);
  }

  /**
   * Translate and format a key
   * @param key - key for the message to get
   * @param bundleName - the bundle where it is located
   * @param locale - the locale to target
   * @param options - Additional options
   * @returns The translated and formatted string
   */
  t(
    key: string,
    bundleName: string,
    locale: Locale,
    options?: fluentVariables,
  ) {
    return this.getLocale(locale)?.t(key, bundleName, options);
  }

  /**
   * For Use with Discord.js command builder to localize commands
   * @param key - key to resolve
   * @param bundleName - name of the bundle where the key is
   * @returns A map of the with the values of all added locale
   * @see {@link https://discord-api-types.dev/api/discord-api-types-payloads/common#LocalizationMap}
   */
  discordLocalizationRecord(key: string, bundleName: string): LocalizationMap {
    const res: LocalizationMap = {};
    for (const [locale, obj] of this.locales)
      res[locale] = obj.t(key, bundleName);

    return res;
  }
}
