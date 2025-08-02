const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT ||5000;
//making a base path
//built in middleware for handling encoded data
app.use(express.urlencoded({extended:false}));

//built in middleware for handling json files
app.use(express.json());

//built in middle ware for handling static files
app.use(express.static(path.join(__dirname,'/public')));
const basePath = path.join(__dirname, '../..');
console.log(path.join(basePath, 'views', 'index.html'));
app.get(/^\/$|\/index(.html)?/,(req,res)=>{
    res.sendFile(path.join(basePath,'views','index.html'));
});

app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));
//comment