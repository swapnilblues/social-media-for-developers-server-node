const User = require('../models/user');
const mongoose = require('mongoose');

const axios = require('axios');

exports.user_populate = async function (req, res, next) {
    
    let data = await axios.get('https://jsonplaceholder.typicode.com/users');
    let dev_data = data.data;

    await User.collection.insert(dev_data, function (err, docs) {
        if (err){
            console.error(err);
        } else {
            console.log(`[LOG] Developers inserted in mongoDB`);
            console.log("Multiple documents inserted to Collection");
        }
    });
    return res.send('added data to mongo');
};

