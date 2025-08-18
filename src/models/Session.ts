import { timeStamp } from 'console';
import { any } from 'joi';
import mongoose, { Schema, Document } from 'mongoose';


interface SessionData extends Document {
  userId: mongoose.Types.ObjectId;
  data: {
    startAt: number;
    endAt: number;
    blinkCount: number;
    neck: {
      neckArr: any[];
      neckBadCount: number;
    };
    move: {
      notMoveMaxCount: number;
    };
    sit: {
      sitted: any[];
      afk: number;
      sitMaxTimeCount: number;
    };
    diatance: {
      badCount: number;
    };
    logs: any[];
  }
}

const SessionSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  data: {
    startAt: { type: Number, required: true },
    endAt: { type: Number, required: true },
    blinkCount: { type: Number, required: true },
    neck: {
      neckArr: { type: [Schema.Types.Mixed], required: true },
      neckBadCount: { type: Number, required: true },
    },
    move: {
      notMoveMaxCount: { type: Number, required: true },
    },
    sit: {
      sitted: { type: [Schema.Types.Mixed], required: true },
      afk: { type: Number, required: true },
      sitMaxTimeCount: { type: Number, required: true },
    },
    diatance: {
      badCount: { type: Number, required: true },
    },
    logs: { type: [Schema.Types.Mixed], required: true },
  }
}, {
  timestamps: true,
});

export default mongoose.model<SessionData>('Session', SessionSchema);