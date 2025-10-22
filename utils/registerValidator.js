import joi from 'joi';

const registerSchema = joi.object({
    username: joi.string().min(3).max(30).required(),
    password: joi.string().min(10).max(30).required(),
    email: joi.string().email().required(),
    weight: joi.number().min(30).max(300).required()
});

const registerValidator = (req, res, next) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
    }
    next();
};

export default registerValidator