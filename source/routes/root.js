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
router.get(/^\/$|\/ape(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','I','ape.html'));
});
router.get(/^\/$|\/cm1(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','I','cm1.html'));
});
router.get(/^\/$|\/fe(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','I','fe.html'));
});
router.get(/^\/$|\/pps(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','I','pps.html'));
});

router.get(/^\/$|\/signup(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','signup.html'));
});
router.get(/^\/$|\/index(.html)?/,(req,res)=>{
    res.sendFile(path.join(__dirname,'..','..','views','index.html'));
});

module.exports = router;