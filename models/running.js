import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const distanceSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  weekNumber: { type: Number, required: true },
  distance: { type: Number, required: true }
}, { timestamps: true });

const Distance = mongoose.model('Distance', distanceSchema);
export default Distance;
