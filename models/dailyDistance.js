import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const dailyDistanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  distance: { type: Number, required: true },
  date: { type: Date, required: true }
});

const DailyDistance = mongoose.model('DailyDistance', dailyDistanceSchema);

export default DailyDistance;
