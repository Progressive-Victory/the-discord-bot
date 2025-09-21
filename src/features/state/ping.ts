import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  Guild,
  GuildMember,
  heading,
  Message,
  MessageCreateOptions,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  roleMention,
  SeparatorSpacingSize,
  Snowflake,
  subtext,
  TextInputBuilder,
  TextInputStyle,
  userMention,
} from "discord.js";
import { States } from "../../models/State.js";
import { AddSplitCustomId, getGuildChannel } from "../../util/index.js";
import { isStateAbbreviations } from "../../util/states/types.js";
import { messageMaxLength, titleMaxLength } from "./constants.js";

/**
 * Executes the ping command to send a message to a channel.
 * @param interaction - The chat input command interaction object.
 * @returns interaction
 */
export default async function ping(interaction: ChatInputCommandInteraction) {
  let guild: Guild;
  let member: GuildMember;
  const { client, options } = interaction;

  // interaction.deferReply({flags:MessageFlags.Ephemeral})

  if (interaction.inCachedGuild()) {
    guild = interaction.guild;
    member = interaction.member;
  } else if (interaction.inRawGuild()) {
    try {
      guild = await client.guilds.fetch(interaction.guildId);
      member = await guild.members.fetch(interaction.user);
    } catch (error) {
      console.log(error);
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "An Error has occurred, contact your administrator",
      });
      return;
    }
  } else {
    throw Error("ping not in guild");
  }
  const stateAbbreviation = options.getString("state", true).toLowerCase();

  if (!isStateAbbreviations(stateAbbreviation))
    return interaction.reply({
      content: "Given state is not a State Abbreviation, please retry",
      flags: MessageFlags.Ephemeral,
    });

  const state = await States.findOne({
    guildId: interaction.guildId,
    abbreviation: stateAbbreviation,
  }).catch(console.error);
  if (!state || !state.roleId || !state.channelId) return;

  // check to see if the person trying to use the command has the role being pinged
  if (!member.roles.cache.has(state.roleId)) {
    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: `You are not allowed to run this command to ${state.name}`,
    });
    return;
  }

  const channel = await getGuildChannel(guild, state.channelId);
  if (!channel || !channel.isSendable()) return;

  const messageOption = options.getString("message", false);
  const titleOption =
    options.getString("title") ?? `${state.name} Announcement`;

  // change the option from is legacy to is components using not was east way to change the logic
  const legacyOption = !(options.getBoolean("usecomponents") ?? false);

  let stateMessageCreateOptions: MessageCreateOptions;
  if (messageOption) {
    if (legacyOption)
      stateMessageCreateOptions = legacyStateMessageCreate(
        state.roleId,
        member.id,
        messageOption,
        titleOption,
      );
    else
      stateMessageCreateOptions = stateMessageCreate(
        state.roleId,
        member.id,
        messageOption,
        titleOption,
      );

    const pingMessage = await channel.send(stateMessageCreateOptions);
    await statePingReply(interaction, pingMessage);
    return;
  }

  const title = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Title")
    .setMaxLength(titleMaxLength)
    .setPlaceholder(`${state.name} Announcement`)
    .setValue(titleOption)
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const message = new TextInputBuilder()
    .setCustomId("message")
    .setLabel("Message")
    .setPlaceholder(`Your message to ${state.name} member`)
    .setMaxLength(messageMaxLength)
    .setRequired(true)
    .setStyle(TextInputStyle.Paragraph);

  const titleRow = new ActionRowBuilder<TextInputBuilder>().setComponents(
    title,
  );
  const messageRow = new ActionRowBuilder<TextInputBuilder>().setComponents(
    message,
  );

  const modal = new ModalBuilder()
    .setCustomId(AddSplitCustomId("sp", stateAbbreviation, legacyOption))
    .setTitle("State Ping Message")
    .setComponents(titleRow, messageRow);

  interaction.showModal(modal);
}

/**
 * @param stateRoleId - The ID of the state role
 * @param authorId - The author of the message
 * @param message - The contents of the message container
 * @param title - The title of the message container
 * @returns a {@link ContainerBuilder} used to format the message the state lead is sending
 * to the guild members with the `stateRoleId` role
 */
export function stateMessageCreate(
  stateRoleId: Snowflake,
  authorId: Snowflake,
  message: string,
  title: string,
): MessageCreateOptions {
  const container = new ContainerBuilder()
    // .setAccentColor()
    .addTextDisplayComponents((builder) =>
      builder.setContent([heading(title), message].join("\n")),
    )
    .addSeparatorComponents((builder) =>
      builder.setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents((builder) =>
      builder.setContent(
        [
          subtext(`Message from your ${roleMention(stateRoleId)} team`),
          subtext(userMention(authorId)),
        ].join("\n"),
      ),
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    // allowedMentions:{parse:['roles']}
  };
}

export function legacyStateMessageCreate(
  stateRoleId: Snowflake,
  authorId: Snowflake,
  message: string,
  title: string,
): MessageCreateOptions {
  return {
    content: [
      heading(title),
      message,
      subtext(`Message from your ${roleMention(stateRoleId)} team`),
      subtext(userMention(authorId)),
    ].join("\n"),
    // allowedMentions:{parse:[AllowedMentionsTypes.Role]}
  };
}

/**
 * @param interaction - the interaction to reply to
 * @param message - the message to send
 * @returns
 */
export async function statePingReply(
  interaction: ModalSubmitInteraction | ChatInputCommandInteraction,
  message: Message<true>,
) {
  const button = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(message.url)
    .setLabel("Jump to Message");
  const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button);

  return interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: "Your message has been sent",
    components: [row],
  });
}
