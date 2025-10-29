import {
  ChatInputCommandInteraction,
  User as DiscordUser,
  Message,
  MessageFlags,
  MessageReaction,
  Snowflake,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { IShift, Shift } from "../../models/Shift.js";
import { IUser, User } from "../../models/User.js";
import { ShiftStatus } from "../../util/enums/ShiftStatus.js";
import dbConnect from "../../util/libmongo.js";

export const clock = new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("clock")
      .setDescription("Tools for tracking your volunteering hours.")
      .addSubcommand((subCommand) =>
        subCommand.setName("in").setDescription("Start a volunteering shift."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("out")
          .setDescription("End a volunteering shift.")
          .addUserOption((option) =>
            option
              .setName("approver")
              .setDescription(
                "Either the event supervisor or your direct superior. (They need to sign off on your hours)",
              )
              .setRequired(true),
          ),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("enter")
          .setDescription("Manually enter a volunteer shift."),
      )
      .addSubcommand((subCommand) =>
        subCommand
          .setName("profile")
          .setDescription("View your volunteering shift history."),
      ),
  )
  .setExecute(async (interaction: ChatInputCommandInteraction) => {
    const inHandler = async (interaction: ChatInputCommandInteraction) => {
      const usr = await retrieveUser(interaction.user.id);

      if (usr.shifts.length > 0 && usr.shifts.find((x) => !x.endTime)) {
        await interaction.reply({
          content: "You already have a shift active",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await dbConnect();

        const shift = await Shift.insertOne({
          startTime: new Date(Date.now()),
          user: usr,
        });

        usr.shifts.push(shift);
        await usr.save();

        await interaction.reply({
          content: "New shift started",
          flags: MessageFlags.Ephemeral,
        });
      }
    };

    const outHandler = async (interaction: ChatInputCommandInteraction) => {
      const usr = await retrieveUser(interaction.user.id);
      const activeShift: IShift | undefined = usr.shifts.find(
        (x) => !x.endTime,
      );
      const approver: DiscordUser = interaction.options.getUser(
        "approver",
        true,
      );

      if (approver.id === interaction.user.id) {
        await interaction.reply({
          content: "You can't enter yourself as the approving signature.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (usr.shifts.length < 1 || !activeShift) {
        await interaction.reply({
          content: "You don't have any active shifts",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await dbConnect();

        activeShift.endTime = new Date(Date.now());
        await activeShift.save();

        interaction.reply({
          content: "Shift ended. Requesting approval...",
          flags: MessageFlags.Ephemeral,
        });

        requestApproval(interaction.user, approver, activeShift);
      }
    };

    const enterHandler = async (interaction: ChatInputCommandInteraction) => {};

    const profileHandler = async (
      interaction: ChatInputCommandInteraction,
    ) => {};

    const subCommand = interaction.options.getSubcommand(true);
    switch (subCommand) {
      case "in":
        await inHandler(interaction);
        break;
      case "out":
        await outHandler(interaction);
        break;
      case "enter":
        await enterHandler(interaction);
        break;
      case "profile":
        await profileHandler(interaction);
        break;
      default:
        throw Error("Unrecognized Subcommand");
    }
  });

async function retrieveUser(id: Snowflake): Promise<IUser> {
  await dbConnect();

  let res: IUser | null = (await User.findOne({ discordId: id })
    .populate("shifts")
    .exec()) as IUser;
  if (!res)
    res = await User.insertOne({
      discordId: id,
      shifts: [],
    });

  return res;
}

async function dmUser(
  usr: DiscordUser,
  msg: string,
): Promise<Message | undefined> {
  if (!usr.dmChannel) await usr.createDM();

  return await usr.send(msg);
}

async function requestApproval(
  usr: DiscordUser,
  approver: DiscordUser,
  shift: IShift,
) {
  const dmStr = `<@${usr.id}> has requested your approving signature on their 
					recent volunteer shift. Please react to this message with the check for yes
					 and the x for no.`;

  const dmMsg = await dmUser(approver, dmStr);
  if (!dmMsg) throw Error("dm message not found");
  await dmMsg.react("✔️");
  await dmMsg.react("❌");

  const collectionFilter = (reaction: MessageReaction, user: DiscordUser) => {
    console.log(reaction);
    return (
      ["✔️", "❌"].includes(reaction.emoji.name ?? "") &&
      user.id === approver.id
    );
  };
  const waitTime = 60 * 1000 * 24;

  await dmMsg
    .awaitReactions({
      filter: collectionFilter,
      max: 1,
      time: waitTime,
      errors: ["time"],
    })
    .then(async (collected) => {
      console.log("ping");
      const reaction = collected.first();

      if (reaction?.emoji.name === "✔️") {
        dmMsg.reply({
          content: "Volunteer hours approved. Thank you for helping.",
        });
        const dmStr = `<@${approver.id}> has approved your volunteer hours signature request!`;
        dmUser(usr, dmStr);

        shift.status = ShiftStatus.Approved;
        const approverUsr = await retrieveUser(approver.id);
        shift.approver = approverUsr;
        shift.save();
      } else {
        dmMsg.reply({
          content: "Volunteer hours denied. Thank you for helping.",
        });
        const dmStr = `<@${approver.id}> has denied your volunteer hours signature request.`;
        dmUser(usr, dmStr);

        shift.status = ShiftStatus.Denied;
        const approverUsr = await retrieveUser(approver.id);
        shift.approver = approverUsr;
        shift.save();
      }
    })
    .catch((collected) => {
      dmMsg.reply({
        content: "Approval request timed out.",
      });
      const dmStr = `<@${approver.id}> failed to approve your volunteer hours signature request in time.`;
      dmUser(usr, dmStr);
    });
}
