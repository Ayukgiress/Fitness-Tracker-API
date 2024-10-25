import express from 'express';
import Workout from '../models/workout.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

// Create a new workout
router.post('/', auth, async (req, res) => {
    const { exercise, startTime, endTime, date, calories } = req.body;
    const userId = req.user.id;
    const newWorkout = new Workout({ exercise, startTime, endTime, date, userId, calories });

    try {
        await newWorkout.save();
        res.status(201).json(newWorkout);
    } catch (error) {
        console.error('Error creating workout:', error);
        res.status(400).json({ msg: 'Error creating workout', error: error.message });
    }
});

// Get workouts by userId
router.get('/:userId', auth, async (req, res) => {
    const userId = req.user.id; 

    try {
        const workouts = await Workout.find({ userId });
        res.json(workouts);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ msg: 'Error fetching workouts', error: error.message });
    }
});

// Update a workout
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { exercise, startTime, endTime, date, calories } = req.body;

    try {
        const updatedWorkout = await Workout.findByIdAndUpdate(id, { exercise, startTime, endTime, date, calories }, { new: true });
        if (!updatedWorkout) return res.status(404).json({ msg: 'Workout not found' });
        res.json(updatedWorkout);
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ msg: 'Error updating workout', error: error.message });
    }
});

// Delete a workout
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedWorkout = await Workout.findByIdAndDelete(id);
        if (!deletedWorkout) return res.status(404).json({ msg: 'Workout not found' });
        res.json({ msg: 'Workout deleted' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ msg: 'Error deleting workout', error: error.message });
    }
});

export default router;
