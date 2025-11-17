import { Snowflake, subtext, TextDisplayBuilder } from "discord.js";

/**
 * @param userId - The user ID used in the content of the footer
 * @param id - the ID for the display
 * @returns a {@link TextDisplayBuilder} to use as the footer for a user
 */
export function footer(userId: Snowflake, id?: number) {
  const text: string[] = [subtext(`User ID: ${userId}`)];
  const display = new TextDisplayBuilder().setContent(text.join("\n"));
  if (id) display.setId(id);
  return display;
}
