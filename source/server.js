require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const db = require('./models/database');
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

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

app.use(express.urlencoded({extended:false}));
app.use(express.json());

const basePath = path.join(__dirname, '..');
const staticOptions = isProduction
    ? { maxAge: '7d', etag: true, immutable: false }
    : { etag: true };

app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'views', 'home.html'));
});
app.use('/subjects', express.static(path.join(basePath,'data','subjects'), staticOptions));
app.use(express.static(path.join(basePath,'public'), staticOptions));
app.use(express.static(path.join(basePath,'views'), staticOptions));

app.use('/tests', express.static(path.join(basePath, 'data', 'testpaperjson'), staticOptions));
app.use('/question_images', express.static(path.join(basePath, 'data','question_images'), staticOptions));

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/root'));
app.use('/subdir', require('./routes/subdir'));

app.use(function(err,req,res,next){
    console.error(err.stack)
    res.status(500).send(err.message)
})

app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));
