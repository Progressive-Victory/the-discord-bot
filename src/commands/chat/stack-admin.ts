import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  User,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";

export const stackAdmin = new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("stack-admin")
      .setDescription("Administrate the stack system.")
      .setContexts(InteractionContextType.Guild)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((subCommand) =>
        subCommand
          .setName("remove")
          .setDescription("Remove an individual from the stack.")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("User you want to remove from the stack.")
              .setRequired(true),
          ),
      )
      .addSubcommand((subCommand) =>
        subCommand.setName("skip").setDescription("Skip the current speaker."),
      )
      .addSubcommand((subCommand) =>
        subCommand.setName("reset").setDescription("Clear the entire stack."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("start")
          .setDescription("Start a stack in this channel."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("stop")
          .setDescription("End the stack in this channel."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("close")
          .setDescription("Close the stack to any new joins."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("open")
          .setDescription("Open the stack to any new joins."),
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

    const removeHandler = async (
      interaction: ChatInputCommandInteraction,
      user: User,
    ) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/remove", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
            userId: user.id,
          }),
        });

        if (res.status != 200) {
          const msg = await res.text();
          throw Error(
            `API returned status other than 200: ${res.status}` +
              (msg != "" ? `\nAPI message: ${msg}` : ""),
          );
        }

        const data = JSON.parse(await res.text());

        await interaction.reply({
          content: `User: <@${data.toString()}> has been successfully removed from the stack`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const skipHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/skip", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
          }),
        });

        if (res.status != 200) {
          const msg = await res.text();
          throw Error(
            `API returned status other than 200: ${res.status}` +
              (msg != "" ? `\nAPI message: ${msg}` : ""),
          );
        }

        const data = JSON.parse(await res.text());

        await interaction.reply({
          content: `<@${data.toString()}> has successfully been skipped`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const resetHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/reset", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
          }),
        });

        if (res.status != 200) {
          const msg = await res.text();
          throw Error(
            `API returned status other than 200: ${res.status}` +
              (msg != "" ? `\nAPI message: ${msg}` : ""),
          );
        }

        const data = JSON.parse(await res.text());
        const { size, deleted } = data;

        await interaction.reply({
          content: `Stack has successfully been reset\nRemoved ${deleted.length}/${size} users`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const startHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/start", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
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
          content: "Stack successfully started in this channel",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const stopHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/stop", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
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
          content: "Successfully stopped the stack in this channel",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const closeHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/close", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
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
          content: "Successfully closed the stack in this channel",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const openHandler = async (interaction: ChatInputCommandInteraction) => {
      try {
        if (!process.env.API_KEY) throw Error("Please have API_KEY filled out");

        const res = await fetch(process.env.API_URL + "/stack-admin/open", {
          headers: {
            authorization: process.env.API_KEY,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            channelId: interaction.channelId,
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
          content: "Successfully opened the stack in this channel",
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          // @ts-ignore
          content: "Something has gone wrong!\nerror: " + error.message,
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case "remove":
        await removeHandler(
          interaction,
          interaction.options.getUser("user", true),
        );
        break;
      case "skip":
        await skipHandler(interaction);
        break;
      case "reset":
        await resetHandler(interaction);
        break;
      case "start":
        await startHandler(interaction);
        break;
      case "stop":
        await stopHandler(interaction);
        break;
      case "close":
        await closeHandler(interaction);
        break;
      case "open":
        await openHandler(interaction);
        break;
    }
  });
