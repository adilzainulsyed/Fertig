const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT ||5000;
//making a base path
//built in middleware for handling encoded data
app.use(express.urlencoded({extended:false}));

//built in middleware for handling json files
app.use(express.json());

const basePath = path.join(__dirname, '../..');
console.log(basePath)
//built in middle ware for handling static files
app.use(express.static(path.join(basePath,'/public')));



app.get(/^\/$|\/index(.html)?/,(req,res)=>{
    res.sendFile(path.join(basePath,'views','index.html'));
});
app.get(/^\/$|\/login(.html)?/,(req,res)=>{
    res.sendFile(path.join(basePath,'views','login.html'));
});


app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));
//comment