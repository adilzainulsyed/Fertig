require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const db = require('./models/database');
const PORT = process.env.PORT || 5000;

const corsoptions = {
    origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else if (process.env.NODE_ENV === 'production') {
            callback(new Error('Not allowed by CORS'));
        } else {
            callback(null, true);
        }
    },
    optionsSuccessStatus: 200
}
app.use(cors(corsoptions));

app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

const basePath = path.join(__dirname, '..');
console.log('basePath', basePath);
app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'views', 'home.html'));
});
app.use('/subjects', express.static(path.join(basePath,'data','subjects')));
console.log("Serving subjects from:", path.join(basePath,'data','subjects'));
app.use(express.static(path.join(basePath,'public')));
app.use(express.static(path.join(basePath,'views')));

app.use('/tests', express.static(path.join(basePath, 'data', 'testpaperjson')));
app.use('/question_images', express.static(path.join(basePath, 'data','question_images')));

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/root'));
app.use('/subdir', require('./routes/subdir'));
app.use('/api/chatbot', require('./routes/chatbot'));

app.use(function(err,req,res,next){
    console.error(err.stack)
    res.status(500).send(err.message)
})

app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));
