import createError from 'http-errors';  
import express from 'express';  
import path from 'path';  
import cookieParser from 'cookie-parser';  
import logger from 'morgan';  
import connectDB from './config/db.js';
import cors from 'cors';  
import dotenv from 'dotenv';  
import passport from 'passport';
import './passport-setup.js'; // Ensure this file initializes Passport strategies
import cookieSession from 'cookie-session';
import session from 'express-session';


dotenv.config();   

const port = process.env.PORT || 5000;  
const app = express(); 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.static(path.join(path.resolve(), 'public')));

app.use(session({
    secret: 'gtIh3cM7o2BnCPLIzqEs0OaNHaclx7zFi67nGT7FJ3gZToF2AmCxB97naV2irllb', // Change this to a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Fitness Tracker API!');
});

// Route handlers
import usersRouter from './routes/users.js';  
import workoutRouter from './routes/workouts.js'; 
import planRouter from './routes/plan.js';

app.use('/users', usersRouter); 
app.use('/workouts', workoutRouter);
app.use('/plan', planRouter);

// Connect to the database
connectDB();

// Error handling middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Error handling for the application
app.use((err, req, res, next) => {  
    console.error('Error details:', err); // Log the full error object
    res.status(err.status || 500).json({  
        error: {  
            message: err.message,  
            status: err.status || 500,  
        },  
    });  
});

// Start the server
app.listen(port, () => console.log(`Server started on port ${port}`));  

export default app;
