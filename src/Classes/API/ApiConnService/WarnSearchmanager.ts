import { CachedManager, GuildMemberResolvable, Snowflake } from "discord.js";

interface WarnSearch = {

}

class WarnSearchOptionsManager extends CachedManager<Snowflake,WarnSearch, GuildMemberResolvable> {
  constructor()
}
