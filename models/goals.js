import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const stepSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  steps: { type: Number, required: true },
  date: { type: Date, required: true }
});

const Step = mongoose.model('Step', stepSchema);

export default Step
