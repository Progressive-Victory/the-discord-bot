import { ChatInputCommand } from "@/Classes";
import ping from "@/features/team/ping";
import { messageMaxLength, titleMaxLength } from "@/features/ping/constants";
import { localize } from "@/i18n";
import {
  ApplicationCommandOptionType,
  InteractionContextType,
} from "discord.js";
import { isGuildMember } from "@/util";

export const ns = "team";

/**
 * The `team` command allows team leads to:
 * <ul>
 *     <li>Ping a team as a team leader</li>
 * </ul>
 */
export default new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("team")
      .setDescription("Commands for skill team leads")
      .setNameLocalizations(localize.discordLocalizationRecord("team-name", ns))
      .setDescriptionLocalizations(
        localize.discordLocalizationRecord("team-description", ns),
      )
      .setContexts(InteractionContextType.Guild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("ping")
          .setDescription("Ping Team")
          .setNameLocalizations(
            localize.discordLocalizationRecord("ping-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord("ping-description", ns),
          )
          .addStringOption((option) =>
            option
              .setName("team")
              .setDescription("team to ping")
              .setNameLocalizations(
                localize.discordLocalizationRecord("ping-team-name", ns),
              )
              .setDescriptionLocalizations(
                localize.discordLocalizationRecord("ping-team-description", ns),
              )
              .setRequired(true)
              .setAutocomplete(true),
          )
          .addStringOption((title) =>
            title
              .setName("title")
              .setDescription("Title of announcement")
              .setNameLocalizations(
                localize.discordLocalizationRecord("ping-title-name", ns),
              )
              .setDescriptionLocalizations(
                localize.discordLocalizationRecord(
                  "ping-title-description",
                  ns,
                ),
              )
              .setMaxLength(titleMaxLength)
              .setRequired(false),
          )
          .addStringOption((message) =>
            message
              .setName("message")
              .setDescription("Text to send in message")
              .setNameLocalizations(
                localize.discordLocalizationRecord("ping-message-name", ns),
              )
              .setDescriptionLocalizations(
                localize.discordLocalizationRecord(
                  "ping-message-description",
                  ns,
                ),
              )
              .setMaxLength(messageMaxLength)
              .setRequired(false),
          ),
      ),
  )

  .setAutocomplete(async (interaction) => {
    const focus = interaction.options.getFocused(true);
    if (
      focus.type !== ApplicationCommandOptionType.String ||
      focus.name !== "team"
    ) {
      await interaction.respond([]).catch(console.error);
      return;
    }

    const { guild } = interaction;
    if (!guild) {
      await interaction.respond([]).catch(console.error);
      return;
    }

    const member = interaction.member;

    if (!isGuildMember(member)) {
      await interaction.respond([]).catch(console.error);
      return;
    }

    // need to "fetch" if not cached maybe?
    const guildRoles = guild.roles.cache;

    const memberRoles = new Set(
      member.roles.cache.map((role) => role.name.toLowerCase()),
    );

    const choices = guildRoles
      .filter((role) => {
        const roleName = role.name.toLowerCase();

        if (role.managed) return false;
        if (role.name === "@everyone") return false;
        if (roleName.endsWith(" lead")) return false;

        return memberRoles.has(`${roleName} lead`);
      })
      .map((role) => ({
        name: role.name,
        value: role.id,
      }))
      .slice(0, 14);
    // console.log(choices);
    await interaction.respond(choices).catch(console.error);
  })
  .setExecute(ping);
