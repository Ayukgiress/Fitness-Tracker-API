import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Step from '../models/goals.js';
import Distance from '../models/running.js';

const router = express.Router();

// Add daily steps
router.post('/daily-steps', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('steps').isInt({ gt: 0 }).withMessage('Steps must be a positive integer'),
  body('date').isISO8601().withMessage('Date is required and must be valid')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, steps, date } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User ID format." });
  }

  try {
    const stepEntry = new Step({
      userId: mongoose.Types.ObjectId(userId),
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

// Add weekly running distance
router.post('/weekly-distance', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('weekNumber').isInt({ gt: 0 }).withMessage('Week number must be a positive integer'),
  body('distance').isFloat({ gt: 0 }).withMessage('Distance must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, weekNumber, distance } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User ID format." });
  }

  try {
    const distanceEntry = new Distance({
      userId: mongoose.Types.ObjectId(userId),
      weekNumber,
      distance
    });
    await distanceEntry.save();
    res.status(201).json(distanceEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving distance entry: " + error.message });
  }
});

// Get daily steps
router.get('/daily-steps', async (req, res) => {
  try {
    const steps = await Step.find();
    res.json(steps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving step entries: " + error.message });
  }
});

// Get weekly distances
router.get('/weekly-distance', async (req, res) => {
  try {
    const distances = await Distance.find();
    res.json(distances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving distance entries: " + error.message });
  }
});

export default router;
