import { ChatInputCommand } from "@/Classes";
import { getMember } from "@/util";
import {
  ActionRowBuilder,
  ChannelType,
  InteractionContextType,
  PermissionsBitField,
  UserSelectMenuBuilder,
} from "discord.js";
import { client } from "../..";

export const ns = "move";

/**
 * The `move` chat command allows users with the permission to move members to move
 * specific/all members in a voice channel to another.
 */
export default new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("move")
      .setDescription("Moves members from one VC to another")
      .setDefaultMemberPermissions(PermissionsBitField.Flags.MoveMembers)
      .setContexts(InteractionContextType.Guild)
      .addChannelOption((option) =>
        option
          .setName("destination")
          .setDescription("Channel where members will be move to")
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("everyone")
          .setDescription("Do you want to move everyone in the VC")
          .setRequired(false),
      ),
  )

  .setExecute(async (interaction) => {
    const { user, options, guild, locale } = interaction;

    if (guild == null) return;

    // Get voice current state of voice channels
    const source = (await getMember(guild, user))?.voice.channel;
    const destination = options.getChannel("destination", true, [
      ChannelType.GuildVoice,
    ]);

    // user must be in a VC to use this command
    if (source == null)
      return interaction.reply({
        content: "You must be in a voice channel to use this command",
        ephemeral: true,
      });
    // Target VC must be different that the users current VC
    else if (source.id == destination.id)
      return interaction.reply({
        content: "Members are already in" + destination.toString(),
        ephemeral: true,
      });
    // If everyone flag is set move all members in a VC to another
    else if (options.getBoolean("everyone")) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [id, member] of source.members)
        await member.voice.setChannel(
          destination,
          `Moved by ${interaction.user.username} using bot command`,
        );

      return interaction.reply({
        content: `All members have been moved to ${destination.toString()}`,
        ephemeral: true,
      });
    }

    // select menu generation
    // users must select between 2 and 8 members to move
    const userMenu = new UserSelectMenuBuilder()
      .setCustomId(
        `usermove${client.splitCustomIdOn}${destination.id}${client.splitCustomIdOn}${source.id}`,
      )
      .setPlaceholder("Select Member")
      .setMaxValues(8)
      .setMinValues(2);

    const topActionRow =
      new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userMenu);

    return interaction.reply({
      content:
        "Select the members you would like to move: " +
        "-#" +
        " Users out side of " +
        source.toString() +
        " will not be moved",
      components: [topActionRow],
      ephemeral: true,
    });
  });
