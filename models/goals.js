import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const stepSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  steps: { type: Number, required: true },
  date: new Date().toISOString()
}, { timestamps: true });

const Step = mongoose.model('Step', stepSchema);
export default Step;
