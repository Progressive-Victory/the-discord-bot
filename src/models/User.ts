import { Snowflake } from "discord.js";
import mongoose, { Document, Model, Schema } from "mongoose";
import { IShift } from "./Shift.js";

export interface IUser extends Document {
  discordId: Snowflake;
  shifts: IShift[];
}

const userSchema = new Schema<IUser>({
  discordId: { type: String, required: true },
  shifts: [{ type: Schema.Types.ObjectId, ref: "Shift" }],
});

export const User: Model<IUser> =
  (mongoose.models as Record<string, Model<IUser>>).User ||
  mongoose.model<IUser>("User", userSchema);
