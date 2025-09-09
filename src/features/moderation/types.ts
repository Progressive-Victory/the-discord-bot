export enum WarnEmbedColor {
  Active = "#57F287",
  updated = "#ff9900",
  Inactive = "#ED4245",
  issued = "#FEE75C",
}

/**
 * The number of embeds that will show when viewing warning. Value can not be greater than 5. This is a Discord limit
 * @see {@link https://discord.com/developers/docs/resources/message#create-message-jsonform-params}
 */
export const numberOfWarnEmbedsOnPage = 3;

export const defaultNumberOfDaysBeforeExpiration = 90;

export const numberRegex: RegExp = /^\d{1,3}$/is;

export enum WarnButtonsPrefixes {
  viewWarningsLeft = "vwl",
  viewWarningsRight = "vwr",
  modViewWarningHistory = "mvwh",
  userViewWarningHistory = "uvwh",
  updateWarnById = "uwbi",
  appealWarn = "aw",
  removeWarnYes = "rwy",
  deleteWarnYes = "dwy",
  removeWarnNo = "rwn",
  deleteWarnNo = "dwn",
}

export enum WarnModalPrefixes {
  createWarning = "cw",
  updateById = "ubi",
}
