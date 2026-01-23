import { IEvent } from "@/features/events/IEvent";

export class EventLogMessageCache {
  private cache: Record<string, IEvent> = {};

  push(logChannelId: string, event: IEvent) {
    this.cache[logChannelId] = event;
  }

  fetch(logMessageId: string): IEvent | undefined;
  fetch(eventId: number): string | undefined;
  fetch(arg: string | number): IEvent | string | undefined {
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
