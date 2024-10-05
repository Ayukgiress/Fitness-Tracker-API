import createError from 'http-errors';  
import express from 'express';  
import path from 'path';  
import cookieParser from 'cookie-parser';  
import logger from 'morgan';  
import connectDB from './config/db.js';
import cors from 'cors';  
import dotenv from 'dotenv';  

import usersRouter from './routes/users.js';  
import workoutRouter from './routes/workouts.js' 

dotenv.config();   

const app = express();  

// Middleware setup  
app.use(logger('dev'));  
app.use(express.json());  
app.use(express.urlencoded({ extended: false }));  
app.use(cookieParser());  
app.use(cors({  
    origin: 'http://localhost:5173'  
}));  
app.use(express.static(path.join(path.resolve(), 'public')));   

app.use('/users', usersRouter); 
app.use("/workouts", workoutRouter);

 

connectDB();



// Error handling  
app.use(function(req, res, next) {  
    next(createError(404));  
});  

app.use(function(err, req, res, next) {  
    res.status(err.status || 500).json({  
        error: {  
            message: err.message,  
            status: err.status || 500,  
        },  
    });  
});  

const PORT = process.env.PORT || 5000;  

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));  

export default app;