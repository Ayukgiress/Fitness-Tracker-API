import express from 'express';
import Workout from '../models/workout.js';
import auth from '../middleWare/auth.js';

const router = express.Router();

// Create a new workout
router.post('/', async (req, res) => {
    const { exercise, startTime, endTime, date, userId, calories } = req.body;
    const newWorkout = new Workout({ exercise, startTime, endTime, date, userId, calories });

    try {
        await newWorkout.save();
        res.status(201).json(newWorkout);
    } catch (error) {
        res.status(400).json({ msg: 'Error creating workout', error });
    }
});

// Get workouts by userId
router.get('/:userId', auth, async (req, res) => {
    console.log("inside workout routes");
    
    const { userId } = req.user.id;
    console.log("user ID", userId);
    
    
    try {
        const workouts = await Workout.find({ userId });
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ msg: 'Error fetching workouts', error });
    }
});

// Update a workout
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { exercise, startTime, endTime, date, calories } = req.body;

    try {
        const updatedWorkout = await Workout.findByIdAndUpdate(id, { exercise, startTime, endTime, date, calories }, { new: true });
        if (!updatedWorkout) return res.status(404).json({ msg: 'Workout not found' });
        res.json(updatedWorkout);
    } catch (error) {
        res.status(500).json({ msg: 'Error updating workout', error });
    }
});

// Delete a workout
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedWorkout = await Workout.findByIdAndDelete(id);
        if (!deletedWorkout) return res.status(404).json({ msg: 'Workout not found' });
        res.json({ msg: 'Workout deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Error deleting workout', error });
    }
});

export default router;
