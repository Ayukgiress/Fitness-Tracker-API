import express from 'express';
import Meal from '../models/meal.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { userId, name, type, date, items, totalCalories } = req.body;

  if (!userId || !name || !type || !date || !items || totalCalories === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid meal type' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items must be a non-empty array' });
  }

  for (const item of items) {
    if (!item.name || item.calories === undefined || item.protein === undefined ||
        item.carbs === undefined || item.fats === undefined || item.quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Each item must have name, calories, protein, carbs, fats, and quantity' });
    }
  }

  try {
    const newMeal = new Meal({
      userId,
      name,
      type,
      date,
      items,
      totalCalories
    });

    const savedMeal = await newMeal.save();

    res.status(201).json({
      success: true,
      meal: {
        _id: savedMeal._id,
        userId: savedMeal.userId,
        name: savedMeal.name,
        type: savedMeal.type,
        date: savedMeal.date,
        items: savedMeal.items,
        totalCalories: savedMeal.totalCalories,
        createdAt: savedMeal.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving meal:', error);
    res.status(500).json({ success: false, message: 'Error saving meal', error: error.message });
  }
});

router.get('/:userId', auth, async (req, res) => {
  const { userId } = req.params;

  try {
    const meals = await Meal.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ success: false, message: 'Error fetching meals', error: error.message });
  }
});

router.get('/:userId/:date', auth, async (req, res) => {
  const { userId, date } = req.params;

  try {
    const meals = await Meal.find({ userId, date }).sort({ createdAt: -1 });
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals for date:', error);
    res.status(500).json({ success: false, message: 'Error fetching meals for date', error: error.message });
  }
});

export default router;
  // Validate items array
