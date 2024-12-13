import createError from 'http-errors';  
import express from 'express';  
import path from 'path';  
import cookieParser from 'cookie-parser';  
import logger from 'morgan';  
import connectDB from './config/db.js';
import cors from 'cors';  
import dotenv from 'dotenv';  
import passport from 'passport';
import './passport-setup.js'; 
import cookieSession from 'cookie-session';
import session from 'express-session';


dotenv.config();   

const port = process.env.PORT || 5000;  
const app = express(); 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(path.resolve(), 'public')));

app.use(session({
    secret: 'gtIh3cM7o2BnCPLIzqEs0OaNHaclx7zFi67nGT7FJ3gZToF2AmCxB97naV2irllb',
    resave: false,
    saveUninitialized: true,
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  

  app.use(cors({
    origin: 'https://fittrack-web.vercel.app', 
    methods: ['GET', 'POST'],
    credentials: true
  }));
  

app.get('/', (req, res) => {
    res.send('Welcome to the Fitness Tracker API!');
});

import usersRouter from './routes/users.js';  
import workoutRouter from './routes/workouts.js'; 
import planRouter from './routes/plan.js';

app.use('/users', usersRouter); 
app.use('/workouts', workoutRouter);
app.use('/plan', planRouter);

connectDB();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

app.use((err, req, res, next) => {  
    console.error('Error details:', err); 
    res.status(err.status || 500).json({  
        error: {  
            message: err.message,  
            status: err.status || 500,  
        },  
    });  
});

app.listen(port, () => console.log(`Server started on port ${port}`));  

export default app;
