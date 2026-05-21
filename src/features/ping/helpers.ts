import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  Message,
  MessageCreateOptions,
  MessageFlags,
  ModalSubmitInteraction,
  roleMention,
  SeparatorSpacingSize,
  Snowflake,
  subtext,
  userMention,
} from "discord.js";

/**
 * @param roleId - The ID of the role
 * @param authorId - The author of the message
 * @param message - The contents of the message container
 * @param title - The title of the message container
 * @returns a {@link ContainerBuilder} used to format the message the role lead is sending
 * to the guild members with the `roleId` role
 */
export function pingMessageCreate(
  roleId: Snowflake,
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
          subtext(`Message from your ${roleMention(roleId)} team`),
          subtext(`Written by ${userMention(authorId)}`),
        ].join("\n"),
      ),
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    // allowedMentions:{parse:['roles']}
  };
}

export function legacyPingMessageCreate(
  roleId: Snowflake,
  authorId: Snowflake,
  message: string,
  title: string,
): MessageCreateOptions {
  return {
    content: [
      heading(title),
      message,
      "",
      subtext(`Message from your ${roleMention(roleId)} team`),
      subtext(`Written by ${userMention(authorId)}`),
    ].join("\n"),
    // allowedMentions:{parse:[AllowedMentionsTypes.Role]}
  };
}

/**
 * @param interaction - the interaction to reply to
 * @param message - the message to send
 * @returns
 */
export async function pingReply(
  interaction: ModalSubmitInteraction | ChatInputCommandInteraction,
  message: Message<true>,
  deferred: boolean = false,
) {
  const button = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setURL(message.url)
    .setLabel("Jump to Message");
  const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button);
  if (deferred) {
    await interaction.editReply({
      content: "Your message has been sent",
      components: [row],
    });
  } else {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Your message has been sent",
      components: [row],
    });
  }
}
