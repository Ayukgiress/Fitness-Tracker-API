import joi from 'joi'

const registerShema = joi.object({
    username: joi.string().min(3).max(30).required(),
    password: joi.string().min(10).max(30).required(),
    email: joi.string().email().required()
})

export default function registerValidator(req, res, next) {
    const { error } = registerShema.validate(req.body);
    if (error) return res.status(400).json({message: error.details[0].message})
        next(error)
}