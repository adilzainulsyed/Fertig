const express = require('express');
const router = express.Router();
const path = require('path');


router.get(/^\/$|\/home(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','home.html'));
});
router.get(/^\/$|\/login(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','login.html'));
});
router.get(/^\/$|\/ds(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','II','ds.html'));
});
router.get(/^\/$|\/dms(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','II','dms.html'));
});
router.get(/^\/$|\/dcso(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','II','dcso.html'));
});
router.get(/^\/$|\/signup(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','signup.html'));
});
router.get(/^\/$|\/index(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','index.html'));
});

module.exports = router;