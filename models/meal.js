import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MealSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  items: [{
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  totalCalories: { type: Number, required: true },
}, { timestamps: true });

// Compound index on userId and date for efficient queries
MealSchema.index({ userId: 1, date: 1 });

const Meal = mongoose.model('Meal', MealSchema);

export default Meal;
