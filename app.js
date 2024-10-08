import createError from 'http-errors';  
import express from 'express';  
import path from 'path';  
import cookieParser from 'cookie-parser';  
import logger from 'morgan';  
import connectDB from './config/db.js';
import cors from 'cors';  
import dotenv from 'dotenv';  

dotenv.config();   

const port = process.env.PORT || 5000;  
const app = express();  

// Middleware setup  
app.use(logger('dev'));  
app.use(express.json());  
app.use(express.urlencoded({ extended: false }));  
app.use(cookieParser());  
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}));
 
app.use(express.static(path.join(path.resolve(), 'public')));   

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Fitness Tracker API!');
});

// Route handlers
import usersRouter from './routes/users.js';  
import workoutRouter from './routes/workouts.js'; 

app.use('/users', usersRouter); 
app.use('/workouts', workoutRouter);

connectDB();

// Error handling  
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
  });
   

app.use(function(err, req, res, next) {  
    console.error('Error details:', err); // Log the full error object
    res.status(err.status || 500).json({  
        error: {  
            message: err.message,  
            status: err.status || 500,  
        },  
    });  
});


app.listen(port, () => console.log(`Server started on port ${port}`));  

export default app;
