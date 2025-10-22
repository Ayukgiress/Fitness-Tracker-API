import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Goal } from '../models/goals.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

// POST: Set a goal (e.g., weekly distance goal)
router.post('/', auth, [
  body('type').isIn(['weeklyDistance', 'dailySteps']).withMessage('Type must be weeklyDistance or dailySteps'),
  body('value').isFloat({ gt: 0 }).withMessage('Value must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { type, value } = req.body;
  const userId = req.user.id;

  try {
    const goal = new Goal({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      value
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving goal: " + error.message });
  }
});

// GET: Fetch user goals
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const goals = await Goal.find({ userId }).sort({ date: -1 });
    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving goals: " + error.message });
  }
});

// PUT: Update a goal
router.put('/:id', auth, [
  body('type').optional().isIn(['weeklyDistance', 'dailySteps']).withMessage('Type must be weeklyDistance or dailySteps'),
  body('value').optional().isFloat({ gt: 0 }).withMessage('Value must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { type, value } = req.body;
  const userId = req.user.id;

  try {
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    if (type !== undefined) goal.type = type;
    if (value !== undefined) goal.value = value;

    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating goal: " + error.message });
  }
});

// DELETE: Delete a goal
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting goal: " + error.message });
  }
});

export default router;
