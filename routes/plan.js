import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Step from '../models/goals.js';
import Distance from '../models/running.js';
import DailyDistance from '../models/dailyDistance.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

// POST: Add daily steps
router.post('/daily-steps', auth, [
  body('steps').isInt({ gt: 0 }).withMessage('Steps must be a positive integer'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { steps, date } = req.body;
  const userId = req.user.id; 

  try {
    const existingEntry = await Step.findOne({
      userId,
      date: new Date(date)
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Steps already logged for this date" });
    }

    const stepEntry = new Step({
      userId: new mongoose.Types.ObjectId(userId),
      steps,
      date
    });
    await stepEntry.save();
    res.status(201).json(stepEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving step entry: " + error.message });
  }
});


// POST: Add daily distance
router.post('/daily-distance', auth, [
  body('distance').isFloat({ gt: 0 }).withMessage('Distance must be a positive number'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { distance, date } = req.body;
  const userId = req.user.id;

  try {
    const existingEntry = await DailyDistance.findOne({
      userId,
      date: new Date(date)
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Distance already logged for this date" });
    }

    const distanceEntry = new DailyDistance({
      userId: new mongoose.Types.ObjectId(userId),
      distance,
      date: new Date(date)
    });
    await distanceEntry.save();
    res.status(201).json(distanceEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving distance entry: " + error.message });
  }
});

// GET: Fetch daily steps (without date)
router.get('/daily-steps', auth, async (req, res) => {
  const userId = req.user.id; 

  try {
    const steps = await Step.find({ userId })
      .sort({ createdAt: -1 }) // Sorting by creation date or any other field you prefer
      .limit(30);

    res.json(steps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving step entries: " + error.message });
  }
});


// GET: Fetch daily distance
router.get('/daily-distance', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const distances = await DailyDistance.find({ userId })
      .sort({ date: -1 }) // Sorting by date
      .limit(30);

    res.json(distances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving distance entries: " + error.message });
  }
});

// GET: Fetch weekly distance
router.get('/weekly-distance', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get the start of the current week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Get the end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyDistances = await DailyDistance.find({
      userId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    const totalDistance = weeklyDistances.reduce((sum, entry) => sum + entry.distance, 0);

    res.json({ totalDistance, weeklyDistances });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving weekly distance: " + error.message });
  }
});


export default router;
