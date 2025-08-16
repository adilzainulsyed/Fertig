const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const PORT = process.env.PORT ||5000;

//cross origin resource sharing
const whitelist = ['https://127.0.0.1:5500','https://localhost:5000'];
const corsoptions = {
    origin: (origin,callback) => {
        if (whitelist.indexOf(origin)!==-1 || !origin){
            callback(null,true); 
        }else{
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus:200
}
app.use(cors(corsoptions));


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
app.use('/question_images', express.static(path.join(basePath, 'data/question_images')));
app.use('/', require('../routes/root'));

app.use('/subdir',require('../routes/subdir'));



app.use(function(err,req,res,next){
    console.error(err.stack)
    res.status(500).send(err.message)
})


app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));


