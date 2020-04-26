const express = require('express');
const mongoose =  require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const populate = require('./routes/populate');
const user = require('./routes/user');
const auth = require('./routes/auth');
const post = require('./routes/posts');
const profile = require('./routes/profile');

const app = express();
const cors = require('cors');

app.use(cors());
app.options('*', cors());
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

const mongoDB = process.env.MONGODB_URI;

mongoose.connect(mongoDB, { useNewUrlParser: true });

mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.json({extended:false}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/codebook/populate',populate);
app.use('/codebook/users',user);
app.use('/codebook/users/auth',auth);
app.use('/codebook/posts',post);
app.use('/codebook/profile', profile)

const port = process.env.PORT || 3002;

app.listen(port, () => {
    console.log('Server is up and running on port number ' + port);
});
