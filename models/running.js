import mongoose from 'mongoose';

const distanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekNumber: { type: Number, required: true },
  distance: { type: Number, required: true }
}, { timestamps: true });

const Distance = mongoose.model('Distance', distanceSchema);
export default Distance;
