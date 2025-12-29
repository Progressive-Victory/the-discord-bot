import { ApiConnService } from "./ApiConnService/ApiConnService.js";
import { APIWarn } from "./ApiConnService/types.js";

export class Warn {
  data: APIWarn;
  api: ApiConnService;

  constructor(api: ApiConnService, data: APIWarn) {
    this.data = data;
    this.api = api;
  }

  get id() {
    return this.data.id;
  }

  get reason() {
    return this.data.reason;
  }

  get targetId() {
    return this.data.userWarnedDiscordId;
  }

  get moderatorId() {
    return this.data.moderatorDiscordId;
  }

  get createdAt() {
    return new Date(this.data.createdAtUtc);
  }

  get expiresAt() {
    return new Date(this.data.expiresAtUtc);
  }

  get updatedAt() {
    return new Date(this.data.updatedAtUtc);
  }
}
