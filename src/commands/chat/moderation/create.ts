import {
  ChatInputCommandInteraction,
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} from "discord.js";
import { WARN_MAX_CHAR } from "../../../features/moderation/index.js";

export async function create(interaction: ChatInputCommandInteraction) {
  const targetMenu = new UserSelectMenuBuilder()
    .setCustomId("member")
    .setRequired(true);
  const targetUser = interaction.options.getUser("member");

  if (targetUser) targetMenu.setDefaultUsers(targetUser?.id);

  const newWarn = new ModalBuilder()
    .setCustomId("nw")
    .setTitle("New Warning")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel("Target Member")
        .setDescription("Member to whom this is issued to")
        .setUserSelectMenuComponent(targetMenu),
      new LabelBuilder()
        .setLabel("Reason")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("reason")
            .setMaxLength(WARN_MAX_CHAR)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true),
        ),
    );
  await interaction.showModal(newWarn);
}
