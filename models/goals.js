import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  steps: { type: Number, required: true }
}, { timestamps: true });

const Step = mongoose.model('Step', stepSchema);
export default Step;
