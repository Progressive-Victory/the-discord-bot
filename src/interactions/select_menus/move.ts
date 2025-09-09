import { UserSelectMenuInteraction, VoiceChannel } from "discord.js";
import { Interaction } from "../../Classes/index.js";
import { ns } from "../../commands/chat/move.js";
import { localize } from "../../i18n.js";
import { client } from "../../index.js";

/**
 * `usermove` is a modal interaction that allows one user to move another from one voice
 * channel to another
 */
export const usermove = new Interaction<UserSelectMenuInteraction>()
  .setCustomIdPrefix("usermove")
  .setRun(async (interaction: UserSelectMenuInteraction) => {
    const { customId, guild, values, locale, user } = interaction;

    if (client.splitCustomIdOn == undefined)
      throw Error("splitCustomIdOn is undefined");
    if (guild == null) throw Error("interaction not in guild");

    const args = customId.split(client.splitCustomIdOn);

    const destination = guild.channels.cache.find(
      (channel) => channel.id === args[1],
    ) as VoiceChannel;
    const source = guild.channels.cache.find(
      (channel) => channel.id === args[2],
    ) as VoiceChannel;
    const selectedMembers = source.members.filter((member) =>
      values.includes(member.id),
    );

    // filter members in VC with those selected
    for (const [, member] of selectedMembers)
      await member.voice.setChannel(
        destination,
        `Moved by ${user.username} using bot command`,
      );

    // updated message that move has been competed
    await interaction.update({
      content: localize.t("reply_moved", ns, locale, {
        destination: destination.toString(),
      }),
      components: [],
    });
  });
