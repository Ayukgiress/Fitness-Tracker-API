import Joi, { date } from "joi";

const workout = Joi.object({
    exercise: Joi.string().min(1).max(20).required(),
    duration: Joi.number().min(1).max(80).required(),
    date: Joi.date().required()

})

function createWorkoutValidator(req, res, next) {
    const {error, value} = workout.validate(req.boby);
    if (error) return res.status(400).json({ message: error.details[0].message})
        req.validateWorkout = value
    next(error)
}

export default createWorkoutValidator