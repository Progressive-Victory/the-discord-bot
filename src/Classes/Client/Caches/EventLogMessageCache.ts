import { DiscordEvent } from "@/contracts/data/DiscordEvent";

export class EventLogMessageCache {
  private cache: Record<string, DiscordEvent> = {};

  push(logChannelId: string, event: DiscordEvent) {
    this.cache[logChannelId] = event;
  }

  fetch(logMessageId: string): DiscordEvent | undefined;
  fetch(eventId: number): string | undefined;
  fetch(arg: string | number): DiscordEvent | string | undefined {
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
