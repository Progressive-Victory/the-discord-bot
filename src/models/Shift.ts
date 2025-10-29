import mongoose, { Document, Model, Schema } from "mongoose";
import { ShiftStatus } from "../util/enums/ShiftStatus.js";
import { IUser, User } from "./User.js";

export interface IShift extends Document {
  startTime: Date;
  endTime?: Date;
  user: IUser;
  approver?: IUser;
  status: ShiftStatus;
}

const shiftSchema = new Schema<IShift>({
  startTime: { type: Schema.Types.Date, required: true },
  endTime: { type: Schema.Types.Date, required: false },
  user: { type: Schema.Types.ObjectId, ref: User, required: true },
  approver: { type: Schema.Types.ObjectId, ref: User, required: false },
  status: { type: Number, required: true, default: ShiftStatus.Pending },
});

export const Shift: Model<IShift> =
  (mongoose.models as Record<string, Model<IShift>>).Shift ||
  mongoose.model<IShift>("Shift", shiftSchema);
