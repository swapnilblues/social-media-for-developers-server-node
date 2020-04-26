const express = require('express');
const router = express.Router();
const {check,validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const auth = require('../client/src/middleware/auth');

const user_controller = require('../controllers/user');

router.get('/all', user_controller.user_all);

// router.post('/name', user_controller.find_by_name);
router.post('/name', (req,res)=> {
    console.log("name");
    if (req.body.name) {
        const regex = new RegExp(escapeRegex(req.body.name), 'gi');
        User.find({name: regex}, function (err, allUsers) {
            if (err) {
                console.log(err);
            } else {
                return res.status(200).send(allUsers)
            }
        })
    }
});

router.get('/id/:id',user_controller.user_unit);

router.post('/',
            [
                check('name', 'Name is required')
                    .not()
                    .isEmpty(),
                check('email', 'Please include a valid email').isEmail(),
                check(
                    'password',
                    'Please enter a password with 3 or more characters'
                ).isLength({ min: 3 })
            ],
            async (req, res) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { name, email, password } = req.body;


                try {
                    let user = await User.findOne({ email });

                    if (user) {
                        return res
                            .status(400)
                            .json({ errors: [{ msg: 'User already exists' }] });
                    }

                    user = new User({
                                        name,
                                        email,
                                        password

                                    });

                    const salt = await bcrypt.genSalt(10);

                    user.password = await bcrypt.hash(password, salt);

                    await user.save();

                    const payload = {
                        user: {
                            id: user.id
                        }
                    };

                    jwt.sign(
                        payload,
                        process.env.jwtSecret,
                        { expiresIn: 360000 },
                        (err, token) => {
                            if (err) throw err;
                            res.json({ token });
                        }
                    );
                } catch (err) {
                    console.error(err.message);
                    res.status(500).send('Server error');
                }
            });

router.delete('/delete/:email', auth , (req,res)=>{
    User.remove({email:req.params.email}, function (err) {
        if (err) {
            return res.send(err);
        }
        res.send('Deleted successfully!');
    })
});

router.put('/update/:email', auth , (req,res)=> {
    User.findOneAndUpdate({email: req.params.email}, {$set: {username: req.body.username}},
                          function (err, user) {
                              if (err) {
                                  return next(err);
                              }
                              res.send('User updated.');
                          });
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");
}

module.exports = router;
