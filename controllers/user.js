const User = require('../models/user');
const mongoose = require('mongoose');

const axios = require('axios');

exports.user_all = function (req, res, next) {
    User.find({},(err,users)=>{
        if(users){
            console.log(users)
            res.json(users);
        }
              }
    )
}

// exports.find_by_name = function(req,res){
// if(req.body.name){
//     const regex = new RegExp(escapeRegex(req.body.name),'gi');
//     User.find({name:regex},function(err,allUsers){
//         if(err){
//             console.log(err);
//         }
//         else{
//            return res.send(allUsers)
//         }
//     })
// }
// }

exports.user_unit = function (req, res, next) {
    User.findById(req.params.id).exec((err,user)=>{
        if(err)
            return res.json(err)
        return res.json(user)
    })
};

exports.user_add = function (req, res, next) {
    User.findById(req.params.id).exec((err,user)=>{
        if(err)
            return res.json(err)
        return res.json(user)
    })
};

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");
}
