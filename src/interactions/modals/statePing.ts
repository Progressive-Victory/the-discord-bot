import { Routes } from "@/Classes/API/ApiConnService/routes";
import { Interaction } from "@/Classes/Interaction";
import {
  legacyPingMessageCreate,
  pingMessageCreate,
  pingReply,
} from "@/features/ping/helpers";
import { apiConnService } from "@/util/api/pvapi";
import {
  IDiscordStateRole,
  zDiscordStateRole,
} from "@/util/states/discordStateRole";
import { isStateAbbreviations } from "@/util/states/types";
import {
  Guild,
  MessageCreateOptions,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";

/**
 * `statePing` is a modal interaction that provides state leads an interface
 * to send a message to their state's channel. It checks whether a channel is configured
 * for a given state, and if it does, sends the message to the channel.
 */
export const statePing = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: "sp",
  run: async (interaction) => {
    const { customId, client, fields, user } = interaction;
    const splitOn = client.splitCustomIdOn;

    let guild: Guild;
    if (interaction.inCachedGuild()) {
      guild = interaction.guild;
    } else if (interaction.inRawGuild()) {
      guild = await client.guilds.fetch(interaction.guildId);
    } else return;

    if (!splitOn) return;
    const args = customId.split(splitOn);

    const stateAbbreviation = args[1];
    const legacyOption = args[2] === "true";

    if (!isStateAbbreviations(stateAbbreviation)) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let state: IDiscordStateRole;
    try {
      state = await apiConnService.get<IDiscordStateRole>(
        Routes.discordStateRole(stateAbbreviation),
        zDiscordStateRole,
      );
    } catch (err) {
      console.error(err);
      if (
        typeof err === "object" &&
        err &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        await interaction.editReply(err.message);
      }
      return;
    }
    const content = fields.getTextInputValue("message");
    const title = fields.getTextInputValue("title");
    const stateChannel =
      guild.channels.cache.get(state.memberChannelId) ??
      (await guild.channels.fetch(state.memberChannelId).catch(console.error));
    if (!(stateChannel && stateChannel.isSendable())) return;

    let stateMessageCreateOptions: MessageCreateOptions;

    if (legacyOption)
      stateMessageCreateOptions = legacyPingMessageCreate(
        state.memberRoleId,
        user.id,
        content,
        title,
        "team",
      );
    else
      stateMessageCreateOptions = pingMessageCreate(
        state.memberRoleId,
        user.id,
        content,
        title,
        "team",
      );

    const pingMessage = await stateChannel.send(stateMessageCreateOptions);

    await pingReply(interaction, pingMessage, true);
  },
});
