import { ForumChannel, Role, TextChannel } from "discord.js";
import { StateAbbreviation } from "./types";

export class State {
  readonly name: string;

  readonly abbreviation: StateAbbreviation;

  readonly role?: Role;

  readonly channels?: (TextChannel | ForumChannel)[];

  get client() {
    return this.role?.client;
  }

  get guild() {
    return this.role?.guild ?? undefined;
  }

  constructor(config: IState) {
    this.name = config.name;
    this.abbreviation = config.abbreviation;
    this.role = config.role;
    this.channels = config.channels;
  }
}

interface IState {
  name: string;
  abbreviation: StateAbbreviation;
  role?: Role;
  channels?: (TextChannel | ForumChannel)[];
}
