import {
  ChannelType,
  inlineCode,
  InteractionContextType,
  InteractionReplyOptions,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandChannelOption,
} from "discord.js";
import { UpdateQuery } from "mongoose";
import { ChatInputCommand } from "../../Classes/index.js";
import { GuildSetting, ISettings } from "../../models/Setting.js";

const channel = new SlashCommandChannelOption()
  .setName("channel")
  .setDescription("target channel")
  .addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread)
  .setRequired(true);

// const role = new SlashCommandRoleOption()
// 	.setName('role')
// 	.setDescription('target role')
// 	.setRequired(true)

/**
 * The `settings` command allows guild managers to configure the PV bot settings.
 * The configuration is persisted in MongoDB. The command supports:
 * <ul>
 *     <li>Setting the log and appeal channels for warnings</li>
 *     <li>Setting the welcome channel</li>
 *     <li>Setting the channel for report logs</li>
 *     <li>Setting the channels for various other logs</li>
 * </ul>
 */
export const settings = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("settings for the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("warn")
        .setDescription("configure wanning system")
        .addSubcommand((subCommand) =>
          subCommand
            .setName("channels")
            .setDescription("configure channels for warn system")
            .addStringOption((option) =>
              option
                .setName("setting")
                .setDescription("Setting to edit")
                .setChoices(
                  { name: "log", value: "warn.logChannelId" },
                  // { name: 'appeal', value: 'warn.appealChannelId' },
                )
                .setRequired(true),
            )
            .addChannelOption(channel),
        ),
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("report")
        .setDescription("Config user report")
        .addSubcommand((subCommand) =>
          subCommand
            .setName("channels")
            .setDescription("configure channels for report system")
            .addStringOption((option) =>
              option
                .setName("setting")
                .setDescription("Setting to edit")
                .setChoices({ name: "log", value: "report.logChannelId" })
                .setRequired(true),
            )
            .addChannelOption(channel),
        ),
    )
    .addSubcommandGroup(
      (subcommandGroup) =>
        subcommandGroup
          .setName("welcome")
          .setDescription("Config welcome settings")
          .addSubcommand((subCommand) =>
            subCommand
              .setName("channel")
              .setDescription("configure channels for log system")
              .addChannelOption(channel),
          ),
      // .addSubcommand(subCommand => subCommand
      // 	.setName('role')
      // 	.setDescription('configure channels for log system')
      // 	.addRoleOption(role)
      // )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("logging")
        .setDescription("Config logs")
        .addSubcommand((subCommand) =>
          subCommand
            .setName("channels")
            .setDescription("configure channels for log system")
            .addStringOption((option) =>
              option
                .setName("setting")
                .setDescription("Setting to edit")
                .setChoices(
                  { name: "timeouts", value: "logging.timeoutChannelId" },
                  { name: "leaves", value: "logging.leaveChannelId" },
                  {
                    name: "channel updates",
                    value: "logging.channelUpdatesChannelId",
                  },
                  {
                    name: "vc updates",
                    value: "logging.voiceUpdatesChannelId",
                  },
                  {
                    name: "nickname updates",
                    value: "logging.nicknameUpdatesChannelId",
                  },
                  { name: "event logs", value: "logging.eventLogChannelId" },
                )
                .setRequired(true),
            )
            .addChannelOption(channel),
        ),
    ),
  execute: async (interaction) => {
    const subcommandGroup = interaction.options.getSubcommandGroup(true);
    const subCommand = interaction.options.getSubcommand(true);
    const reply: InteractionReplyOptions = { flags: MessageFlags.Ephemeral };
    // console.log(subcommandGroup, subCommand)
    if (subcommandGroup === "welcome") {
      if (subCommand === "channel") {
        const channel = interaction.options.getChannel("channel", true, [
          ChannelType.GuildText,
          ChannelType.PublicThread,
        ]);
        await GuildSetting.findOneAndUpdate(
          { guildId: interaction.guildId },
          { "welcome.channelId": channel.id },
        );
        reply.content = `welcome channel set to ${channel}`;
      }

      // else if (subCommand === 'role') {
      // 	const role = interaction.options.getRole('role', true)
      // 	await GuildSetting.findOneAndUpdate({guildId: interaction.guildId}, {"welcome.roleId": role.id})
      // 	reply.content = `welcome role set to ${role}`
      // }
      else return;

      void interaction.reply(reply);

      return;
    }

    if (subCommand === "channels") {
      const setting = interaction.options.getString("setting", true);
      const channel = interaction.options.getChannel("channel", true, [
        ChannelType.GuildText,
        ChannelType.PublicThread,
      ]);

      const update: UpdateQuery<ISettings> = {};
      update[setting] = channel.id;

      await GuildSetting.findOneAndUpdate(
        { guildId: interaction.guildId },
        update,
      );

      interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `${inlineCode(setting)} has been updated to ${channel}`,
      });
    }
  },
});
