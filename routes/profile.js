const express = require('express');
const router = express.Router();
const auth = require('../client/src/middleware/auth');
const Profile = require('../models/UserProfile');
const Post = require("../models/Post");
const {check, validationResult} = require('express-validator/check');
const User = require('../models/user');

// respond with "Profile route" when a GET request is made to the homepage
router.get('/me', auth, async (request, response) => {
    try {
        const profile = await Profile.findOne({
                                                      user: request.user.id //get user by id
                                                      //this pertains to the user in the
                                                      // Profile model
                                                  })
            .populate('user', ['name', 'avatar']);

        //check to see if there's no profile
        if (!profile) {
            return response.status(400).json({msg: 'Profile for this user does not exist!'})
        }

        //if there is a profile
        await response.json(profile);
    } catch (e) {
        console.error(e.message);
        response.status(500).send('Server Error');
    }
});

router.put('/image',auth, async (req,res)=>{

    const user = req.user.id;
    const imageUrl = req.body.image;

    try {
        let profile = await Profile.findOne({ user : user })
        let u = await User.findById(user)
        // console.log(u);
        u.image = imageUrl;
        // console.log(u);
        await u.save()
        profile.image = imageUrl;
        await profile.save()
        res.json(user)
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server error')
    }
})

//@route POST '/phoneNumber'
//@desc Create or update the phone number
//@access Private
router.post('/phone',auth, async (req ,res) => {

    const user = req.user.id;
    const phoneNumber = req.body.phone;

    try {
        const profile = await Profile.findOne({ user : user })
        profile.phone = phoneNumber;
        await profile.save()
        res.json(profile)
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server error')
    }
})

//@route POST '/profile'
//@desc Create or update a user profile
//@access Private
router.post('/', [
                auth, [
                    // check('status', 'Status is required')
                    //     .not()
                    //     .isEmpty(),
                    // check('skills', 'Skills is required')
                    //     .not()
                    //     .isEmpty()
                ]
            ],
            async (req, res) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({
                                                    errors: errors.array()
                                                });
                }
                const {
                    company,
                    website,
                    bio,
                    status,
                    githubusername,
                    skills,
                    youtube
                } = req.body;

                //Build profile object
                const profileFields = {};
                profileFields.user = req.user.id;
                if (company) {
                    profileFields.company = company;
                }
                if (website) {
                    profileFields.website = website;
                }
                if (bio) {
                    profileFields.bio = bio;
                }
                if (status) {
                    profileFields.status = status;
                }
                if (githubusername) {
                    profileFields.githubusername = githubusername;
                }
                if (skills) {
                    profileFields.skills = skills.split(',')
                        .map(skill => skill.trim());
                }
                // console.log("skills: ", profileFields.skills);

                //Build social array
                profileFields.social = {}
                if (req.body.youtube) {
                    profileFields.social.youtube = req.body.youtube;
                }
                if (req.body.twitter) {
                    profileFields.social.twitter = req.body.twitter;
                }
                if (req.body.facebook) {
                    profileFields.social.facebook = req.body.facebook;
                }
                if (req.body.linkedin) {
                    profileFields.social.linkedin = req.body.linkedin;
                }
                if (req.body.instagram) {
                    profileFields.social.instagram = req.body.instagram;
                }

                Profile.findOne({user: req.user.id}).then(profile => {
                    if (profile) {
                        // Update if profile already exists
                        Profile.findOneAndUpdate(
                            {user: req.user.id},
                            {$set: profileFields},
                            {new: true}
                        ).then(profile => res.json(profile));
                    } else {
                        // Create new if profile does not already exist
                        // Throw error if it already exists
                        Profile.findOne({handle: profileFields.handle}).then(profile => {
                            if (profile) {
                                errors.handle = 'That handle already exists';
                                res.status(400).json(errors);
                            }

                            // Save Profile
                            new Profile(profileFields).save().then(profile => res.json(profile));
                        });
                    }
                });
            }
);

// @route   GET codebook/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res) => {
    const errors = {};

    Profile.find()
        .populate('user', ['name', 'avatar'])
        .then(profiles => {
            if (!profiles) {
                errors.noprofile = 'There are no profiles';
                return res.status(404).json(errors);
            }

            res.json(profiles);
        })
        .catch(err => res.status(404).json({profile: 'There are no profiles'}));
});

// @route   GET codebook/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

router.get('/user/:user_id', (req, res) => {
    const errors = {};

    Profile.findOne({user: req.params.user_id})
        .populate('user', ['name', 'email'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'Profile not found';
                res.status(404).json(errors);
            }

            res.json(profile);
        })
        .catch(err =>
                   res.status(404).json({profile: 'Profile not found'})
        );
});

// @route   DELETE codebook/profile/phone
// @desc    Delete phone number
// @access  Private
router.delete('/phone', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.phone = ''
        await profile.save()
        res.json({msg: 'Phone number deleted'})
    } catch (e) {
        console.err(e.message);
        res.status(500).send('Server Error');
    }
})

// @route   DELETE codebook/profile
// @desc    Delete user and profile
// @access  Private
router.delete('/:userId',  async (req, res) => {
    try {
        await Profile.findOneAndRemove({user: req.params.userId});
        await User.findOneAndRemove({_id: req.params.userId});
        await Post.deleteMany({user:req.params.userId});
        res.json({msg: 'User removed'})
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error');
    }
})

// @route   PUT codebook/experience
// @desc    Add experience
// @access  Private
router.put('/experience', [
               auth,
               [
                   check('title', 'Title is required')
                       .not()
                       .isEmpty(),
                   check('company', 'Company is required')
                       .not()
                       .isEmpty(),
                   check('from', 'From Date is required')
                       .not()
                       .isEmpty(),
               ]
           ]
    , async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400)
                .json({ errors : errors.array() })
        }

        const {
            title,
            company,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
                title,
                company,
                from,
                to,
                current,
                description
        }

        try {
            const profile = await Profile.findOne({ user : req.user.id })
            profile.experience.unshift(newExp)
            await profile.save()
            res.json(profile)
        } catch (e) {
            console.error(e.message)
            res.status(500).send('Server error')
        }
    })

// @route   DELETE codebook/experience
// @desc    Delete experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id});
        const removeIndex = profile.experience.map(item => item.id)
            .indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)
        await profile.save()
        res.json(profile)
    } catch (e) {
        console.err(e.message);
        res.status(500).send('Server Error');
    }
})

// @route   PUT /education
// @desc    Add education
// @access  Private
router.put('/education', [
               auth,
               [
                   check('school', 'School is required')
                       .not()
                       .isEmpty(),
                   check('degree', 'Degree is required')
                       .not()
                       .isEmpty(),
                   check('fieldofstudy', 'Field is required')
                       .not()
                       .isEmpty(),
               ]
           ]
    , async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400)
                .json({ errors : errors.array() })
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try{
            const profile = await Profile.findOne({ user : req.user.id })
            profile.education.unshift(newEdu)
            await profile.save()
            res.json(profile)
        } catch (e) {
            console.error(e.message)
            res.status(500).send('Server error')
        }
    })

// @route   DELETE codebook/education/:edu_id
// @desc    Delete education
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id});
        const removeIndex = profile.education.map(item => item.id)
            .indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)
        await profile.save()
        res.json(profile)
    } catch (e) {
        console.err(e.message);
        res.status(500).send('Server Error');
    }
})

router.put('/experience/:experienceId', auth, async (req, res) => {

    const expId = req.params.experienceId;
    const {
        title,
        company,
        from,
        to,
        current,
        description
    } = req.body;
    const newExp = {
        title,
        company,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({ user : req.user.id })
        const experienceArray = profile.experience;
        for(var i=0;i<experienceArray.length;i++) {
            if (experienceArray[i]._id == expId) {
                experienceArray[i].title = newExp.title;
                experienceArray[i].company = newExp.company;
                experienceArray[i].from = newExp.from;
                experienceArray[i].to = newExp.to;
                experienceArray[i].current = newExp.current;
                experienceArray[i].description = newExp.description;
            }
        }
        profile.experience = experienceArray;
        await profile.save()
        res.json(profile)
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server error')
    }
})

router.put('/education/:educationId', auth, async (req, res) => {

    const eduId = req.params.educationId;
    const {
        school,
        degree,
        from,
        to,
        current,
        description,
        fieldofsudy
    } = req.body;
    const newExp = {
        school,
        degree,
        from,
        to,
        current,
        description,
        fieldofsudy
    }
    try {
        const profile = await Profile.findOne({ user : req.user.id })
        const educationArray = profile.education;
        for(var i=0;i<educationArray.length;i++) {
            if (educationArray[i]._id == eduId) {
                educationArray[i].school = newExp.school;
                educationArray[i].degree = newExp.degree;
                educationArray[i].from = newExp.from;
                educationArray[i].to = newExp.to;
                educationArray[i].current = newExp.current;
                educationArray[i].description = newExp.description;
                educationArray[i].fieldofsudy = newExp.fieldofsudy
            }
        }
        profile.education = educationArray;
        await profile.save()
        res.json(profile)
    } catch (e) {
        console.error(e.message)
        res.status(500).send('Server error')
    }
})


//github usernames==>

// @route    Post api/profile/githubusername
// @desc     Post githubusername
// @access   Public
router.post('/githubusername', auth, async (req, res) => {

    const { githubusername } = req.body;
    console.log("GitHUB Username: ",githubusername)

    console.log(req.user)
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.githubusername = githubusername;

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/profile/githubusername
// @desc     update githubusername
// @access   Public
router.put('/githubusername', auth, async (req, res) => {
    const { githubusername } = req.body;

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.githubusername = githubusername;

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/image', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        res.json(profile.image);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// router.delete('/github',async (req,res)=>{
//     return res.json("Hello from github");
// })

router.delete('/github/delete',auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        console.log(profile)
        profile.githubusername = '';
        console.log(profile)
        await profile.save();
        res.json({msg: 'Github deleted'})
    } catch (e) {
        console.err(e.message);
        res.status(500).send('Server Error');
    }
})

// @route    DELETE api/profile/githubusername
// @desc     Delete githubusername
// @access   Public
// router.delete('/githubusername', async (req, res) => {
//     try {
//         // console.log(req.user.id)
//         // const profile = await Profile.findOne({ user: req.user.id });
//         // console.log(profile)
//         // profile.githubusername = '';
//         // await profile.save();
//         return res.json("Hello");
//     } catch (err) {
//         // console.error(err.message);
//         res.status(500).send(err.message);
//     }
// });

router.put('/follow/:email',auth, async (req,res)=>{
    const user = req.user.id;

    try{
        const userFollower = await User.findById(user);
        const profileFollower = await Profile.findOne({user:userFollower.id});
        const userToFollow = await User.findOne({email:req.params.email});
        const profile = await Profile.findOne({user:userToFollow.id});
        const arr = profile.followers;

        if(userFollower.email==req.params.email)
            return res.send('users cannot follow themselves');

        var i = 0;
        for(i=0;i<arr.length;i++){
            let cur = arr[i];
            if(cur.name==userFollower.name) {
                return res.send('user has already followed');
            }
        }

        arr.push({ name:userFollower.name });
        profile.followers = arr;

        await profile.save();

        const arr2 = profileFollower.following;

        arr2.push({name:userToFollow.name});

        profileFollower.following = arr2;

        await profileFollower.save();

        return res.send('Followed the Geek');
    }catch(err){
        res.status(500).send('Server error');
    }
});



router.put('/unfollow/:email',auth, async (req,res)=>{
    const user = req.user.id;

    try{
        const userFollower = await User.findById(user);
        const userToFollow = await User.findOne({email:req.params.email});
        const profile = await Profile.findOne({user:userToFollow.id});
        const profileFollower = await Profile.findOne({user:userFollower.id});

        let arr = profile.followers;

        if(userFollower.email==req.params.email) {
            return res.send('users cannot unfollow themselves');
        }

        var ct = 0;
        var i = 0;
        for(i=0;i<arr.length;i++){
            let cur = arr[i];
            if(cur.name==userFollower.name) {
                ct++;
            }
        }

        if(ct==0) {
            return res.send('you have to follow before unfollowing');
        }
        console.log('count '+ct);

        arr = arr.filter(c=> c.name!=userFollower.name);
        profile.followers = arr;

        await profile.save();

        let arr2 = profileFollower.following;

        arr2 = arr2.filter(c=>c.name!=userToFollow.name);

        profileFollower.following = arr2;

        await profileFollower.save();

        return res.send('UnFollowed the Geek');
    }catch(err){
        res.status(500).send('Server error');
    }
});

module.exports = router;

