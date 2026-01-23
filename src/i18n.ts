import { Locale } from "discord.js";
import { i18n } from "./Classes";

// Load locales
// Note: setGlobalResource should always be set first
export const localize = new i18n({ fallbackLocale: Locale.EnglishUS })
  .setGlobalResource("./locales")
  .setLocale("./locales/en-US", Locale.EnglishUS);
