import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { WARN_MAX_CHAR } from ".";
import { defaultNumberOfDaysBeforeExpiration } from "./types";

/**
 * Create Modal for creating or updating warn
 * @param customId - The custom ID for the modal
 * @param title - The title of the modal
 * @param reason - The reason for issuing the warning
 * @param day - The duration of the warning in days
 * @returns a modal representing the creation/update of a warn
 */
export function warnModal(
  customId: string,
  title: string,
  reason?: string,
  day?: number,
) {
  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason for issuing this warning")
    .setMaxLength(WARN_MAX_CHAR)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setLabel("Number of days till warning expires")
    .setPlaceholder(defaultNumberOfDaysBeforeExpiration.toString())
    .setMinLength(1)
    .setMaxLength(3)
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  if (reason) reasonInput.setValue(reason);

  if (day) durationInput.setValue(day.toString());

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    reasonInput,
  );
  const secondActionRow =
    new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);

  const modal = new ModalBuilder()
    .setTitle(title)
    .setCustomId(customId)
    .addComponents(firstActionRow, secondActionRow);

  return modal;
}
