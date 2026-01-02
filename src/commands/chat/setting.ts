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
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { apiConnService } from "../../util/api/pvapi.js";

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
        .setDescription("configure warning system")
        .addSubcommand((subCommand) =>
          subCommand
            .setName("channels")
            .setDescription("configure channels for warn system")
            .addStringOption((option) =>
              option
                .setName("setting")
                .setDescription("Setting to edit")
                .setChoices(
                  { name: "log", value: "warn_log_channel_id" },
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
                .setChoices({ name: "log", value: "report_log_channel_id" })
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
                  { name: "timeouts", value: "timeout_log_channel_id" },
                  { name: "leaves", value: "leave_log_channel_id" },
                  {
                    name: "channel updates",
                    value: "channel_updates_log_channel_id",
                  },
                  {
                    name: "vc updates",
                    value: "voice_updates_log_channel_id",
                  },
                  {
                    name: "nickname updates",
                    value: "nickname_updates_log_channel_id",
                  },
                  { name: "event logs", value: "event_log_channel_id" },
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

        try {
          await apiConnService.patch(
            Routes.updateSettingValue("welcome_channel_id"),
            {
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: channel.id }),
            },
          );

          reply.content = `welcome channel set to ${channel}`;
        } catch (err) {
          console.error(err);
          reply.content = `failed to modify welcome channel to ${channel}`;
        }
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

      let msg;
      try {
        await apiConnService.patch(Routes.updateSettingValue(setting), {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: channel.id }),
        });

        msg = `${inlineCode(setting)} has been updated to ${channel}`;
      } catch (err) {
        console.error(err);
        msg = `${inlineCode(setting)} has encountered an error and has not been updated to ${channel}`;
      }

      interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: msg,
      });
    }
  },
});
