const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../client/src/middleware/auth');
// const User = require('../models/user');
const Post = require('../models/Post');


router.post('/',
            [
                auth,
                [
                    check('text','there is no text in the post').not().isEmpty()
                ]
            ],
            async (req,res)=>{
                const errorsValidation = validationResult(req);
                if(!errorsValidation.isEmpty())
                    return res.status(400).json({errorsValidation:errorsValidation.array()});

                try{
                    const user = await User.findById(req.user.id).select('-password');
                    const newPost = new Post({
                        text:req.body.text,
                        user:user.id
                                             });
                    const savedPost = await newPost.save();
                    return res.json(savedPost);
                }
                catch (e) {
                    return res.status(500).json('server error');
                }
            }
);

router.get('/:id',auth, async (req,res) =>{
    try{
        const post = await Post.findById(req.params.id).populate('user');
        if(!post)
            return res.status(404).json('Cannot find post');
        return res.json(post);
    }
    catch(e){
        console.error(e.message)
        if(e.kind==='ObjectId')
            return res.status(400).json("No post found");
        return res.status(500).json('Server error');
    }
})

router.put('/like/:id',auth, async (req,res)=>{

    try{
        const post = await Post.findById(req.params.id);
        const filteredPost = post.likes.filter(like => like.user.toString()===req.user.id);
        if(filteredPost.length>0){
            return res.status(400).json('You have already liked the post');
        }else {
            const like = {user: req.user.id};
            post.likes.push(like);
            await post.save();
            res.json(post.likes);
        }
    }
    catch(e){
        console.log(e)
        return res.status(500).json('Server error');
    }
})

router.post('/comment/:id',
            [
                auth,
                [
                    check('text','some text should be there in the'
                                 + ' comment').not().isEmpty()
                ]
            ],
            async (req,res)=>{
                const errorsValidation = validationResult(req.body);
                if(!errorsValidation.isEmpty())
                    return res.status(400).json({errorsValidation:errorsValidation.array()});

                try {
                    const post = await Post.findById(req.params.id);
                    if (!post)
                        return res.status(404).json('post not available');

                    const comment = {
                        user: req.user.id,
                        text: req.body.text
                    }

                    post.comments.push(comment);
                    await post.save();
                    res.json(post.comments);
                }
                catch(e){
                    console.log(e)
                    return res.status(500).json('server error');
                }
            })

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }).populate('user');
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check for ObjectId format and post
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        await post.remove();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/posts/admin/post/:id
// @desc     Delete a post by ID without auth
// @access   Private
router.delete('/admin/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check for ObjectId format and post
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        await post.remove();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // Get remove index
        const removeIndex = post.likes
            .map(like => like.user.toString())
            .indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Pull out comment
        const comment = post.comments.find(
            comment => comment.id === req.params.comment_id
        );
        // Make sure comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }
        // Check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        post.comments = post.comments.filter(
            ({ id }) => id !== req.params.comment_id
        );

        await post.save();

        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

router.delete('/admin/delete/:id', async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        await post.remove();

        return res.json('Post Removed');
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
})


router.put('/admin/update/:id', async (req,res)=>{
    try{
        const post = await Post.findById(req.params.id);

        post.text = req.body.text;

        await post.save();

        return res.json(post);
    }catch(err){
        return res.status(500).send('Server error');
    }
})



module.exports = router;
