import { Collection } from "discord.js";

export type StateAbbreviation =
  | "al"
  | "ak"
  | "az"
  | "ar"
  | "as"
  | "ca"
  | "co"
  | "ct"
  | "de"
  | "dc"
  | "fl"
  | "ga"
  | "gu"
  | "hi"
  | "id"
  | "il"
  | "in"
  | "ia"
  | "ks"
  | "ky"
  | "la"
  | "me"
  | "md"
  | "ma"
  | "mi"
  | "mn"
  | "ms"
  | "mo"
  | "mt"
  | "ne"
  | "nv"
  | "nh"
  | "nj"
  | "nm"
  | "ny"
  | "nc"
  | "nd"
  | "mp"
  | "oh"
  | "ok"
  | "or"
  | "pa"
  | "pr"
  | "ri"
  | "sc"
  | "sd"
  | "tn"
  | "tx"
  | "ut"
  | "vt"
  | "va"
  | "vi"
  | "wa"
  | "wv"
  | "wi"
  | "wy";

export interface IState {
  name: string;
  abbreviation: StateAbbreviation;
}

export const states: { name: string; abbreviation: StateAbbreviation }[] = [
  { name: "Alabama", abbreviation: "al" },
  { name: "Alaska", abbreviation: "ak" },
  { name: "Arizona", abbreviation: "az" },
  { name: "Arkansas", abbreviation: "ar" },
  // { name: 'American Samoa', abbreviation: 'as' },
  { name: "California", abbreviation: "ca" },
  { name: "Colorado", abbreviation: "co" },
  { name: "Connecticut", abbreviation: "ct" },
  { name: "Delaware", abbreviation: "de" },
  { name: "District of Columbia", abbreviation: "dc" },
  { name: "Florida", abbreviation: "fl" },
  { name: "Georgia", abbreviation: "ga" },
  // { name: 'Guam', abbreviation: 'gu' },
  { name: "Hawaii", abbreviation: "hi" },
  { name: "Idaho", abbreviation: "id" },
  { name: "Illinois", abbreviation: "il" },
  { name: "Indiana", abbreviation: "in" },
  { name: "Iowa", abbreviation: "ia" },
  { name: "Kansas", abbreviation: "ks" },
  { name: "Kentucky", abbreviation: "ky" },
  { name: "Louisiana", abbreviation: "la" },
  { name: "Maine", abbreviation: "me" },
  { name: "Maryland", abbreviation: "md" },
  { name: "Massachusetts", abbreviation: "ma" },
  { name: "Michigan", abbreviation: "mi" },
  { name: "Minnesota", abbreviation: "mn" },
  { name: "Mississippi", abbreviation: "ms" },
  { name: "Missouri", abbreviation: "mo" },
  { name: "Montana", abbreviation: "mt" },
  { name: "Nebraska", abbreviation: "ne" },
  { name: "Nevada", abbreviation: "nv" },
  { name: "New Hampshire", abbreviation: "nh" },
  { name: "New Jersey", abbreviation: "nj" },
  { name: "New Mexico", abbreviation: "nm" },
  { name: "New York", abbreviation: "ny" },
  { name: "North Carolina", abbreviation: "nc" },
  { name: "North Dakota", abbreviation: "nd" },
  // { name: 'Northern Mariana Islands', abbreviation: 'mp' },
  { name: "Ohio", abbreviation: "oh" },
  { name: "Oklahoma", abbreviation: "ok" },
  { name: "Oregon", abbreviation: "or" },
  { name: "Pennsylvania", abbreviation: "pa" },
  { name: "Puerto Rico", abbreviation: "pr" },
  { name: "Rhode Island", abbreviation: "ri" },
  { name: "South Carolina", abbreviation: "sc" },
  { name: "South Dakota", abbreviation: "sd" },
  { name: "Tennessee", abbreviation: "tn" },
  { name: "Texas", abbreviation: "tx" },
  { name: "Utah", abbreviation: "ut" },
  { name: "Vermont", abbreviation: "vt" },
  { name: "Virginia", abbreviation: "va" },
  // { name: 'Virgin Islands', abbreviation: 'vi' },
  { name: "Washington", abbreviation: "wa" },
  { name: "West Virginia", abbreviation: "wv" },
  { name: "Wisconsin", abbreviation: "wi" },
  { name: "Wyoming", abbreviation: "wy" },
];

export const stateNames = new Collection<StateAbbreviation, IState>();

states.map((value) => stateNames.set(value.abbreviation, value));

const abbreviations = states.map((value) => value.abbreviation);

export const statesConfig = states;

/**
 * @param a - the abbreviation to check
 * @returns whether `a` is a valid state abbreviation
 */
export function isStateAbbreviations(a: string): a is StateAbbreviation {
  if (a.length !== 2) return false;
  return abbreviations.includes(a as StateAbbreviation);
}
