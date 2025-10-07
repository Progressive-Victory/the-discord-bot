import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";

export const stack = new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("stack")
      .setDescription("Interact with the stack system.")
      .setContexts(InteractionContextType.Guild)
      .addSubcommand((subCommand) =>
        subCommand.setName("add").setDescription("Adds self to stack list."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("remove")
          .setDescription("Removes self from stack list."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("check")
          .setDescription("Checks current stack list."),
      ),
  )
  .setExecute(async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.inGuild()) return;
    if (!interaction.channel?.isVoiceBased()) {
      await interaction.reply({
        content: "This command can only be used in voice channels",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const addHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-gen/add", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
            userId: interaction.member?.user.id,
          }),
        });

        if (res.status != 200) {
          const msg = await res.text();
          throw Error(
            `API returned status other than 200: ${res.status}` +
              (msg != "" ? `\nAPI message: ${msg}` : ""),
          );
        }

        await interaction.reply({
          content: "You've been successfully added to the stack",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error(error);
        interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const removeHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");
        const res = await fetch(process.env.API_URL + "/stack-gen/remove", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
            userId: interaction.member?.user.id,
          }),
        });

        if (res.status != 200) {
          const msg = await res.text();
          throw Error(
            `API returned status other than 200: ${res.status}` +
              (msg != "" ? `\nAPI message: ${msg}` : ""),
          );
        }

        await interaction.reply({
          content: "You've been successfully removed from the stack",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error(error);

        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const checkHandler = async (interaction: ChatInputCommandInteraction) => {
      const formatStack = (list: string[]) => {
        if (list.length == 0) return "The stack is empty";

        let out = "";
        for (let i = 0; i < list.length; i++) {
          if (i == 0) {
            out += `Speaker: <@${list[i]}>`;
          } else {
            out += `\n${i}: <@${list[i]}>`;
          }
        }

        return out;
      };

      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(
          process.env.API_URL +
            "/stack-gen/check?channelId=" +
            interaction.channelId,
          {
            headers: {
              authorization: process.env.API_KEY,
            },
            method: "GET",
          },
        );

        if (res.status != 200) {
          const msg = await res.text();
          throw Error(
            `API returned status other than 200: ${res.status}` +
              (msg != "" ? `\nAPI message: ${msg}` : ""),
          );
        }

        const data = JSON.parse(await res.text());

        interaction.reply({
          content: formatStack(data),
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error(error);

        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case "add":
        await addHandler(interaction);
        break;
      case "remove":
        await removeHandler(interaction);
        break;
      case "check":
        await checkHandler(interaction);
        break;
    }
  });
