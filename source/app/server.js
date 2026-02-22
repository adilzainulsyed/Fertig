require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const db = require('../models/database');
const PORT = process.env.PORT || 5000;

//cross origin resource sharing - allow localhost for development
const corsoptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else if (process.env.NODE_ENV === 'production') {
            callback(new Error('Not allowed by CORS'));
        } else {
            callback(null, true); // Allow all in development
        }
    },
    optionsSuccessStatus: 200
}
app.use(cors(corsoptions));

//
app.use(express.static('public'));

//built in middleware for handling encoded data
app.use(express.urlencoded({extended:false}));

//built in middleware for handling json files
app.use(express.json());



//making a base path

const basePath = path.join(__dirname, '../..');
console.log(basePath)
app.use('/subjects', express.static(path.join(__dirname,'../../data/subjects')));
console.log("Serving subjects from:", path.join(basePath,'/data/subjects'));
//built in middle ware for handling static files
app.use(express.static(path.join(basePath,'/public')));
app.use(express.static(path.join(__dirname, '../../views')));

// serve test paper JSON files
app.use('/tests', express.static(path.join(basePath, 'data', 'testpaperjson')));


app.use('/question_images', express.static(path.join(basePath, 'data/question_images')));

// Authentication routes
app.use('/', require('../routes/auth'));

app.use('/', require('../routes/root'));

app.use('/subdir',require('../routes/subdir'));


app.use(function(err,req,res,next){
    console.error(err.stack)
    res.status(500).send(err.message)
})


app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));

app.use('/api/chatbot', require('../routes/chatbot'));
