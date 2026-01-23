import { IDiscordEvent } from "../../../features/events/IDiscordEvent.js";

export class EventLogMessageCache {
  private cache: Record<string, IDiscordEvent> = {};

  push(logChannelId: string, event: IDiscordEvent) {
    this.cache[logChannelId] = event;
  }

  fetch(logMessageId: string): IDiscordEvent | undefined;
  fetch(eventId: number): string | undefined;
  fetch(arg: string | number): IDiscordEvent | string | undefined {
    if (typeof arg === "string") {
      try {
        return this.cache[arg];
      } catch {
        return undefined;
      }
    } else {
      return Object.keys(this.cache).find((x) => this.cache[x].id === arg);
    }
  }

  delete(logMessageId: string): boolean;
  delete(eventId: number): boolean;
  delete(arg: string | number): boolean {
    if (typeof arg === "string") {
      try {
        delete this.cache[arg];
        return true;
      } catch {
        return false;
      }
    } else {
      const record = Object.keys(this.cache).find(
        (x) => this.cache[x].id === arg,
      );

      if (!record) return false;

      delete this.cache[record];

      return true;
    }
  }
}
