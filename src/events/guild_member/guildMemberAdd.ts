import { apiConnService } from "@/util/api/pvapi";
import Event from "@/Classes/Event";
import { Events } from "discord.js";
import { Routes } from "@/Classes/API/ApiConnService/routes";
import { zCreateUserRequest } from "@/contracts/requests/CreateUserRequest";

/**
 * `guildMemberAdd` handles the {@link Events.GuildMemberAdd} {@link Event}. Currently,
 * it simply emits DEBUG logs about the new member
 */
export const guildMemberAdd = new Event({
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    member.client.emit(
      Events.Debug,
      `user ${member.id} "${member.user.username}"  joined at ${member.joinedTimestamp}`,
    );
    try {
      await apiConnService.post(Routes.users, null);
    } catch (e) {
      console.error(e);
    }
  },
});
