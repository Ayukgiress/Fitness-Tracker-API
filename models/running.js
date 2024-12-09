import mongoose from 'mongoose';

const DistanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Distance', DistanceSchema);