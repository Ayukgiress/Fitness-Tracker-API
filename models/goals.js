import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const stepSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  steps: { type: Number, required: true },
  date: Date,
}, { timestamps: true });

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['weeklyDistance', 'dailySteps'] },
  value: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Step = mongoose.model('Step', stepSchema);
const Goal = mongoose.model('Goal', goalSchema);

export { Step, Goal };
export default Step;
