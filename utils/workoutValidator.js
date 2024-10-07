const workoutSchema = Joi.object({  
    exercise: Joi.string().min(1).required(),  
    duration: Joi.number().positive().required(),  
    date: Joi.date().iso().required(),  
    userId: Joi.string().required(),  
    calories: Joi.number().integer().positive().required()  
});  

// Validation middleware  
 const validateWorkout = (req, res, next) => {  
    const { error } = workoutSchema.validate(req.body);  
    if (error) {  
        return res.status(400).json({ msg: error.details[0].message });  
    }  
    next();  
}; 

export default validateWorkout