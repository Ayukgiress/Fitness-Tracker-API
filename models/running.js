import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const distanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekNumber: { type: Number, required: true },
  distance: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Distance = mongoose.model('Distance', distanceSchema);

export default Distance;
