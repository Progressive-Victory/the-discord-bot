import { AddSplitCustomId } from "@/util";
import {
  ChatInputCommandInteraction,
  MessageCreateOptions,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  LabelBuilder,
  roleMention,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { messageMaxLength, titleMaxLength } from "../ping/constants";
import {
  legacyPingMessageCreate,
  pingMessageCreate,
  pingReply,
  resolveGuildInteraction,
} from "../ping/helpers";

export async function sendTeamPing(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  baseRoleId: string,
  title: string,
  message: string,
  legacyOption: boolean,
): Promise<void> {
  const resolved = await resolveGuildInteraction(interaction);
  if (!resolved) {
    await interaction.reply({
      content: "This command must be used in a guild channel.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const { guild, member } = resolved;
  const baseRole = guild.roles.cache.get(baseRoleId);
  if (!baseRole) {
    await interaction.editReply({
      content: "Given team is not a valid role, please retry.",
    });
    return;
  }

  const leadRole = guild.roles.cache.find(
    (role) => role.name.toLowerCase() === `${baseRole.name.toLowerCase()} lead`,
  );
  if (!leadRole) {
    await interaction.editReply({
      content: `No lead role found for ${baseRole.name}`,
    });
    return;
  }

  if (!member.roles.cache.has(leadRole.id)) {
    await interaction.editReply({
      content: `You must have the ${roleMention(leadRole.id)} role to ping this team.`,
    });
    return;
  }

  const currentChannel = interaction.channel;
  if (
    !currentChannel ||
    currentChannel.isDMBased() ||
    !currentChannel.isSendable()
  ) {
    await interaction.editReply({
      content: "The current channel cannot receive team pings.",
    });
    return;
  }

  const messageCreateOptions: MessageCreateOptions = legacyOption
    ? legacyPingMessageCreate(baseRoleId, member.id, message, title)
    : pingMessageCreate(baseRoleId, member.id, message, title);

  const pingMessage = await currentChannel.send(messageCreateOptions);
  await pingReply(interaction, pingMessage, true);
}

/**
 * Executes the ping command to send a message to a channel.
 * @param interaction - The chat input command interaction object.
 * @returns interaction
 */
export default async function ping(interaction: ChatInputCommandInteraction) {
  const { options } = interaction;
  const baseRoleId = options.getString("team", true);
  const titleOption = options.getString("title");
  const messageOption = options.getString("message", false);

  const legacyOption = false;

  if (!messageOption) {
    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setMaxLength(titleMaxLength)
      .setPlaceholder(`Team Announcement`)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    if (titleOption) titleInput.setValue(titleOption);

    const messageInput = new TextInputBuilder()
      .setCustomId("message")
      .setPlaceholder(`Your message to team members`)
      .setMaxLength(messageMaxLength)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const titleLabel = new LabelBuilder()
      .setLabel("Title")
      .setTextInputComponent(titleInput);

    const messageLabel = new LabelBuilder()
      .setLabel("Message")
      .setTextInputComponent(messageInput);

    const modal = new ModalBuilder()
      .setCustomId(AddSplitCustomId("tp", baseRoleId, legacyOption))
      .setTitle("Team Ping Message")
      .addLabelComponents(titleLabel, messageLabel);

    await interaction.showModal(modal);
    return;
  }

  await sendTeamPing(
    interaction,
    baseRoleId,
    titleOption ?? "Team Announcement",
    messageOption,
    legacyOption,
  );
}
