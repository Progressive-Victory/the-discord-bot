import {
  ApplicationCommandOptionType,
  ChannelType,
  InteractionContextType,
  InteractionReplyOptions,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { States } from "../../models/State.js";
import {
  isStateAbbreviations,
  stateNames,
  states,
} from "../../util/states/types.js";

/**
 * The `state-admin` allows a guild manager to configure the state system:
 * <ul>
 *     <li>Set the channel for a state</li>
 *     <li>Correlate a role to a state</li>
 * </ul>
 */
export const stateAdmin = new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("state-admin")
      .setDescription("configure state system")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setContexts(InteractionContextType.Guild)
      .addSubcommandGroup((subCommandGroup) =>
        subCommandGroup
          .setName("team")
          .setDescription("set state team")
          .addSubcommand((subCommand) =>
            subCommand
              .setName("set")
              .setDescription("configure sate settings")
              .addStringOption((option) =>
                option
                  .setName("state")
                  .setDescription("abbreviation of the state to edit")
                  .setRequired(true)
                  .setAutocomplete(true),
              )
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setDescription("set state channel")
                  .addChannelTypes(ChannelType.GuildText),
              )
              .addRoleOption((option) =>
                option.setName("role").setDescription("set state role"),
              ),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setDescription("configure state settings")
          .addStringOption((option) =>
            option
              .setName("state")
              .setDescription("abbreviation of the state to edit")
              .setRequired(true)
              .setAutocomplete(true),
          )
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("set state channel")
              .addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
              ),
          )
          .addRoleOption((option) =>
            option.setName("role").setDescription("set state role"),
          ),
      ),
  )
  .setExecute(async (interaction) => {
    if (!interaction.inGuild()) return;

    const { guildId, options } = interaction;

    const abbreviation = options.getString("state", true);
    if (!isStateAbbreviations(abbreviation)) {
      interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "select state or uses state abbreviation",
      });
      return;
    }

    const subcommandGroup = options.getSubcommandGroup();
    // const subCommand = options.getSubcommand(true)

    const role = options.getRole("role") ?? undefined;
    const channel =
      options.getChannel("channel", false, [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
      ]) ?? undefined;
    const message: InteractionReplyOptions = { flags: MessageFlags.Ephemeral };
    const name = stateNames.get(abbreviation)?.name;

    let state = await States.findOne({ guildId, abbreviation, name });
    if (!state) state = new States({ guildId, abbreviation, name });
    if (!role && !channel) {
      message.content = `No update made to ${name} settings`;
    } else if (subcommandGroup === "team") {
      if (role?.id) state.team.roleId = role.id;
      if (channel?.id) state.team.channelId = channel.id;
      message.content = `updated state team for ${name} settings`;
    } else {
      if (role?.id) state.roleId = role.id;
      if (channel?.id) state.channelId = channel.id;
      message.content = `updated state for ${name} settings`;
    }
    await state.save();
    interaction.reply(message);
  })
  .setAutocomplete((interaction) => {
    const focus = interaction.options.getFocused(true);
    if (
      focus.type !== ApplicationCommandOptionType.String &&
      focus.name !== "state"
    ) {
      interaction.respond([]);
      return;
    }

    const choices = states
      .filter(
        (s) =>
          s.name.toLowerCase().startsWith(focus.value.toLowerCase()) ||
          s.abbreviation.startsWith(focus.value.toLowerCase()),
      )
      .slice(0, 14)
      .map((state) => ({
        name: state.name,
        value: state.abbreviation,
      }));

    interaction.respond(choices).catch(console.error);
  });
