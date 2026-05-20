import { fetchSetting } from "@/util/api/fetchSettings.js";
import {
  ActionRowBuilder,
  APIApplicationCommandOptionChoice,
  blockQuote,
  bold,
  ButtonBuilder,
  ChatInputCommandInteraction,
  ContainerBuilder,
  DiscordAPIError,
  EmbedBuilder,
  Guild,
  GuildMember,
  heading,
  HeadingLevel,
  inlineCode,
  LabelBuilder,
  MessageCreateOptions,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuOptionBuilder,
  subtext,
  TextInputBuilder,
  TextInputStyle,
  time,
  TimestampStyles,
  User,
} from "discord.js";
import { userViewWarnHistory } from "./buttons";

const BAN_COLOR = 0x7c018c;

// min and max characters for report reason
export const minBanReason = 20;
export const maxBanReason = 1500;

// Values are number of seconds in the past that messages will be deleted
export const deleteMessagesChoices: APIApplicationCommandOptionChoice<number>[] =
  [
    { name: "Don't Delete Any", value: 0 },
    { name: "Previous Hour", value: 60 * 60 },
    { name: "Previous 6 Hours", value: 6 * 60 * 60 },
    { name: "Previous 12 Hours", value: 12 * 60 * 60 },
    { name: "Previous 24 Hours", value: 24 * 60 * 60 },
    { name: "Previous 3 Days", value: 3 * 24 * 60 * 60 },
    { name: "Previous 7 Days", value: 7 * 24 * 60 * 60 },
  ];

// Default permissions
export const banDefaultMemberPermissions =
  PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers;

/**
 * ban this user
 * @param interaction - Chat Input Command interaction from user
 */
export async function banUserChatCommand(
  interaction: ChatInputCommandInteraction<"cached">,
) {
  const options = interaction.options;

  const member = options.getMember("user");
  const user = options.getUser("user", true);

  // Check that user is able to be banned
  if (member && !isBannable(member, interaction.member)) {
    await interaction.reply({
      content: `${member.toString()} is unable to be banned`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const reason = options.getString("reason") ?? undefined;
  const deleteMessages = options.getNumber("delete_messages", true);

  const confirm = banModalBuilder(user, reason, deleteMessages);

  await interaction.showModal(confirm);
}

export async function banUserModal(
  interaction: ModalSubmitInteraction<"cached">,
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const { guild, fields } = interaction;

  const member = fields.getSelectedMembers("user")?.first();

  if (!(member && isBannable(member, interaction.member))) {
    await interaction.editReply({
      content: `${member?.toString()} was unable to be banned. Ask Administrator if this is a mistake`,
    });
    return;
  }

  const reason = fields.getTextInputValue("reason");
  const deleteMessages = Number(
    fields.getStringSelectValues("delete_messages"),
  );
  const [LogComponents] = await Promise.all([
    LogUserBan(member.user, interaction.member, reason, deleteMessages),
    banUserDM(member.user, guild, reason),
  ]);

  try {
    await member.ban({
      reason,
      deleteMessageSeconds: deleteMessages,
    });
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      await interaction.editReply({
        content: `User was unable to be banned. Error: ${inlineCode(error.message)}`,
      });
      return;
    }
  }
  await interaction.editReply({
    components: LogComponents,
    flags: MessageFlags.IsComponentsV2,
  });
}

export function banModalBuilder(
  user: User,
  reason?: string,
  deleteMessages: number = -1,
) {
  const userMenuLabel = new LabelBuilder()
    .setLabel("Target User")
    .setDescription("User who will be banned")
    .setUserSelectMenuComponent((userMenu) =>
      userMenu
        .setCustomId("user")
        .setRequired(true)
        .addDefaultUsers(user.id)
        .setMaxValues(1)
        .setMinValues(1),
    );

  const reasonText = new TextInputBuilder()
    .setCustomId("reason")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Explain reasoning for user ban")
    .setRequired(true)
    .setMinLength(minBanReason)
    .setMaxLength(maxBanReason);

  if (reason) {
    reasonText.setValue(reason);
  }

  const reasonLabel = new LabelBuilder()
    .setLabel("Reason")
    .setDescription("explanation of Ban. This will be sent to user")
    .setTextInputComponent(reasonText);

  const deleteMessageLabel = new LabelBuilder()
    .setLabel("Delete Messages")
    .setStringSelectMenuComponent((deleteMessageMenu) =>
      deleteMessageMenu
        .setCustomId("delete_messages")
        .setRequired(true)
        .setMinValues(1)
        .setMaxValues(1)
        .setOptions(
          deleteMessagesChoices.map((c) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(c.name)
              .setValue(c.value.toString())
              .setDefault(deleteMessages === c.value),
          ),
        ),
    );

  return new ModalBuilder()
    .setCustomId(`ban`)
    .setTitle(`Confirm User Ban`)
    .addLabelComponents(userMenuLabel, reasonLabel, deleteMessageLabel);
}

export function isBannable(member: GuildMember, moderator: GuildMember) {
  // console.log(
  //   !member.user.bot,
  //   member.bannable,
  //   member.id !== moderator.id,
  //   !member.permissions.has(PermissionFlagsBits.BanMembers, true),
  // );
  return (
    !member.user.bot &&
    member.bannable &&
    member.id !== moderator.id &&
    !member.permissions.has(PermissionFlagsBits.BanMembers, true)
  );
}

/**
 * log the ban in specified logging server
 * @param interaction - command interaction from user
 */
async function LogUserBan(
  target: User,
  moderator: GuildMember,
  reason: string,
  deleteMessages: number,
) {
  const guild = moderator.guild;
  const settingsChannelId = (await fetchSetting("timeout_log_channel_id")).data;

  const logChannel = guild.channels.cache.get(settingsChannelId);
  if (!logChannel?.isSendable()) return;

  const container = new ContainerBuilder()
    .setAccentColor(BAN_COLOR)
    .addSectionComponents((section) =>
      section
        .setThumbnailAccessory((userProfile) =>
          userProfile
            .setURL(target.displayAvatarURL({ forceStatic: true }))
            .setDescription(`User Profile for ${target.displayName}`),
        )
        .addTextDisplayComponents((text) =>
          text.setContent(
            [
              heading("User Banned"),
              `${bold("Member")}:		${[target.toString(), inlineCode(target.displayName)].join(" ")}`,
              `${bold("Moderator")}:	${[moderator.toString(), inlineCode(target.displayName)].join(" ")}`,
              `${bold("Messages Deleted")}: ${deleteMessagesChoices.find((c) => c.value === deleteMessages)?.name}`,
              heading("Reason", HeadingLevel.Three),
              blockQuote(reason),
            ].join("\n"),
          ),
        ),
    )
    .addTextDisplayComponents((footer) =>
      footer.setContent(
        subtext(time(new Date(), TimestampStyles.LongDateShortTime)),
      ),
    );

  const viewWarnHistory = new ActionRowBuilder<ButtonBuilder>().addComponents(
    userViewWarnHistory(target.id, guild),
  );
  const LogMessage: MessageCreateOptions = {
    components: [container, viewWarnHistory],
    flags: MessageFlags.IsComponentsV2,
  };
  await logChannel.send(LogMessage);
  return LogMessage.components;
}

/**
 * send a dm to the user informing them of why they were banned
 * @param interaction - command interaction from user
 */
async function banUserDM(
  target: User,
  guild: Guild,
  reason: string = "an unknown reason",
) {
  await target.send({
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          iconURL: guild.iconURL({ forceStatic: true }) ?? undefined,
          name: guild.name,
        })
        .setTitle("Server Ban")
        .setDescription(`You were banned for ${reason}.`)
        .setTimestamp()
        .setColor(BAN_COLOR),
    ],
  });
}
