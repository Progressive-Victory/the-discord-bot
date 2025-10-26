import {
  ActionRowBuilder,
  ColorResolvable,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const userReportColor: ColorResolvable = "#9ad360";
export const messageReportColor: ColorResolvable = "#f5f5dc";

export enum reportModalPrefix {
  userReport = "ur",
  messageReport = "mr",
}

const comment = new TextInputBuilder()
  .setCustomId("comment")
  .setLabel("📬 Comment")
  .setPlaceholder("Spam, etc")
  .setStyle(TextInputStyle.Paragraph)
  .setMaxLength(500)
  .setRequired(false);

export const reportModel = new ModalBuilder()
  .setTitle("Report")
  .addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(comment),
  );
