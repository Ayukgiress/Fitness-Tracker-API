import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const WorkoutSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  exercise: String,
  startTime: { type: String, required: true }, // Use String for time
  endTime: { type: String, required: true },
  date: Date,
  calories: Number,
}, { timestamps: true });

const Workout = mongoose.model('Workout', WorkoutSchema);

export default Workout;
