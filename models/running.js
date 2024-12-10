import mongoose from 'mongoose';
const distanceSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  weekNumber: { type: Number, required: true },
  distance: { type: Number, required: true },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const Distance = mongoose.model('Distance', distanceSchema);
export default Distance;
