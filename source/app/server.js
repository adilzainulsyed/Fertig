const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT ||5000;
//making a base path

const basePath = path.join(__dirname, '../..');
console.log(path.join(basePath, 'views', 'index.html'));
app.get(/^\/$|\/index(.html)?/,(req,res)=>{
    res.sendFile(path.join(basePath,'views','index.html'));
});

app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));