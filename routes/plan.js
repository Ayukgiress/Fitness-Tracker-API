import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Step from '../models/goals.js';
import Distance from '../models/running.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

router.post('/daily-steps', auth, [
  body('steps').isInt({ gt: 0 }).withMessage('Steps must be a positive integer'),
  body('date').isISO8601().withMessage('Date is required and must be valid')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { steps, date } = req.body;
  const userId = req.user.id; 

  try {
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


router.post('/weekly-distance', auth, [
  body('weekNumber').isInt({ gt: 0 }).withMessage('Week number must be a positive integer'),
  body('distance').isFloat({ gt: 0 }).withMessage('Distance must be a positive number'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { weekNumber, distance, date } = req.body;
  const userId = req.user.id; 

  try {
    const distanceEntry = new Distance({
      userId: new mongoose.Types.ObjectId(userId),
      weekNumber,
      distance,
      date: date ? new Date(date) : undefined
    });
    await distanceEntry.save();
    res.status(201).json(distanceEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving distance entry: " + error.message });
  }
});

router.get('/daily-steps', auth, async (req, res) => {
  const userId = req.user.id; 

  try {
    const steps = await Step.find({ userId });
    res.json(steps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving step entries: " + error.message });
  }
});

router.get('/weekly-distance', auth, async (req, res) => {
  const userId = req.user.id; 

  try {
    const distances = await Distance.find({ userId });
    res.json(distances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving distance entries: " + error.message });
  }
});

export default router;
