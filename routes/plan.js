import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Step from '../models/goals.js';
import Distance from '../models/running.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

// POST: Add daily steps (without date)
router.post('/daily-steps', auth, [
  body('steps').isInt({ gt: 0 }).withMessage('Steps must be a positive integer'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { steps } = req.body;
  const userId = req.user.id; 

  try {
    const existingEntry = await Step.findOne({
      userId,
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Steps already logged for today" });
    }

    const stepEntry = new Step({
      userId: new mongoose.Types.ObjectId(userId),
      steps,
    });

    await stepEntry.save();
    res.status(201).json(stepEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving step entry: " + error.message });
  }
});


// POST: Add weekly distance (without date)
router.post('/weekly-distance', auth, [
  body('weekNumber').isInt({ gt: 0 }).withMessage('Week number must be a positive integer'),
  body('distance').isFloat({ gt: 0 }).withMessage('Distance must be a positive number'),
  body('userId').optional().isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { weekNumber, distance } = req.body;
  const userId = req.user.id;

  try {
    const existingEntry = await Distance.findOne({
      userId,
      weekNumber
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Distance already logged for this week" });
    }

    const distanceEntry = new Distance({
      userId: new mongoose.Types.ObjectId(userId),
      weekNumber,
      distance,
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


// GET: Fetch weekly distance (without date)
router.get('/weekly-distance', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const distances = await Distance.find({ userId })
      .sort({ createdAt: -1 }) // Sorting by creation date or any other field you prefer
      .limit(12);

    res.json(distances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving distance entries: " + error.message });
  }
});


export default router;
