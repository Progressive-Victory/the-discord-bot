import { Routes } from "@/Classes/API/ApiConnService/routes";
import { AddSplitCustomId, getGuildChannel } from "@/util";
import { apiConnService } from "@/util/api/pvapi";
import {
  IDiscordStateRole,
  zDiscordStateRole,
} from "@/util/states/discordStateRole";
import { isStateAbbreviations } from "@/util/states/types";
import {
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageCreateOptions,
  MessageFlags,
  ModalBuilder,
  roleMention,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { messageMaxLength, titleMaxLength } from "../ping/constants";
import {
  pingMessageCreate,
  legacyPingMessageCreate,
  pingReply,
  resolveGuildInteraction,
} from "../ping/helpers";

/**
 * Executes the ping command to send a message to a channel.
 * @param interaction - The chat input command interaction object.
 * @returns interaction
 */
export default async function ping(interaction: ChatInputCommandInteraction) {
  const { options } = interaction;

  // interaction.deferReply({flags:MessageFlags.Ephemeral})

  const resolved = await resolveGuildInteraction(interaction);
  if (!resolved) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "An Error has occurred, contact your administrator",
    });
    return;
  }
  const { guild, member } = resolved;

  const stateAbbreviation = options.getString("state", true).toLowerCase();

  if (!isStateAbbreviations(stateAbbreviation)) {
    await interaction.reply({
      content: "Given state is not a State Abbreviation, please retry",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const messageOption = options.getString("message", false);
  const titleOption = options.getString("title");

  // change the option from is legacy to is components using not was east way to change the logic
  const legacyOption = !(options.getBoolean("usecomponents") ?? false);

  if (!messageOption) {
    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setMaxLength(titleMaxLength)
      .setPlaceholder(`State Announcement`)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    if (titleOption) titleInput.setValue(titleOption);

    const messageInput = new TextInputBuilder()
      .setCustomId("message")
      .setPlaceholder(`Your message to state member`)
      .setMaxLength(messageMaxLength)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    if (messageOption) messageInput.setValue(messageOption);

    const titleLabel = new LabelBuilder()
      .setLabel("Title")
      .setTextInputComponent(titleInput);

    const messageLabel = new LabelBuilder()
      .setLabel("Message")
      .setTextInputComponent(messageInput);

    const modal = new ModalBuilder()
      .setCustomId(AddSplitCustomId("sp", stateAbbreviation, legacyOption))
      .setTitle("State Ping Message")
      .addLabelComponents(titleLabel, messageLabel);

    await interaction.showModal(modal);
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  let state: IDiscordStateRole | undefined = undefined;

  try {
    state = await apiConnService.get<IDiscordStateRole>(
      Routes.discordStateRole(stateAbbreviation),
      zDiscordStateRole,
    );

    // console.log(state);
  } catch (err) {
    console.error(err);
    if (
      typeof err === "object" &&
      err &&
      "message" in err &&
      typeof err.message === "string"
    ) {
      await interaction.editReply(err.message);
      return;
    }
  }

  if (!state) return;

  // check to see if the person trying to use the command has the role being pinged
  if (!member.roles.cache.has(state.memberRoleId)) {
    await interaction.editReply({
      content: `You are missing the ${roleMention(state.memberRoleId)} state role.`,
      allowedMentions: {},
    });
    return;
  }

  const channel = await getGuildChannel(guild, state.memberChannelId);
  if (!channel || !channel.isSendable()) return;

  let stateMessageCreateOptions: MessageCreateOptions;
  if (messageOption) {
    if (legacyOption)
      stateMessageCreateOptions = legacyPingMessageCreate(
        state.memberRoleId,
        member.id,
        messageOption,
        titleOption ?? `${state.stateName} Announcement`,
        "team",
      );
    else
      stateMessageCreateOptions = pingMessageCreate(
        state.memberRoleId,
        member.id,
        messageOption,
        titleOption ?? `${state.stateName} Announcement`,
        "team",
      );

    const pingMessage = await channel.send(stateMessageCreateOptions);
    await pingReply(interaction, pingMessage, true);
    return;
  }
}
