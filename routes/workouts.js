// routes/workout.js
import express from 'express';
import Workout from '../models/workout.js';
const router = express.Router();

router.post('/', async (req, res) => {
    const { exercise, duration, date, userId, calories } = req.body; // Include calories here
    const newWorkout = new Workout({ exercise, duration, date, userId, calories }); // Add calories to the new workout
    await newWorkout.save();
    res.status(201).json(newWorkout);
});

// Get workouts by user
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const workouts = await Workout.find({ userId });
    res.json(workouts); // This will include calories
});

// Update workout
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { exercise, duration, date, calories } = req.body; // Include calories in the update

    try {
        const updatedWorkout = await Workout.findByIdAndUpdate(id, { exercise, duration, date, calories }, { new: true });
        if (!updatedWorkout) return res.status(404).json({ msg: 'Workout not found' });
        res.json(updatedWorkout);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete workout
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedWorkout = await Workout.findByIdAndDelete(id);
        if (!deletedWorkout) return res.status(404).json({ msg: 'Workout not found' });
        res.json({ msg: 'Workout deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

export default router;
