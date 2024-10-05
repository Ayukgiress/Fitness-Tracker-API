// models/workout.js
import mongoose from 'mongoose';

const WorkoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    exercise: String,
    duration: Number,
    date: Date,
    calories: Number,  // Use Number instead of number
});

const Workout = mongoose.model('Workout', WorkoutSchema);

export default Workout;
