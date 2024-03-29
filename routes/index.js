var express = require('express');
var router = express.Router();

// import models
require('../models/Posts');
require('../models/Comments');
require('../models/Users');

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var passport = require('passport');
var jwt = require('express-jwt');

var auth = jwt({
    secret: '#$%^&*(FGHJ!nb42', // use an environment variable for referencing your secret
    userProperty: 'payload',
    algorithms: ['HS256']
});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

/* GET all posts. */
router.get('/posts', function(req, res, next) {
    Post.find(function(err, posts) {
        if (err) {
            return next(err);
        }

        res.json(posts);
    });
});

/* POST a new post. */
router.post('/posts', auth, function(req, res, next) {
    var post = new Post(req.body);
    post.author = req.payload.username;

    post.save(function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

/* preload post object */
router.param('post', function(req, res, next, id) {
    var query = Post.findById(id);

    query.exec(function(err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error('can\'t find post'));
        }

        req.post = post;
        return next();
    });
});

/* GET a post by id. */
router.get('/posts/:post', function(req, res) {
    // res.json(req.post);
    req.post.populate('comments', function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

/* upvote post. */
router.put('/posts/:post/upvote', auth, function(req, res, next) {
    req.post.upvote(req.payload._id, next, function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

/* downvote post. */
router.put('/posts/:post/downvote', auth, function(req, res, next) {
    req.post.downvote(req.payload._id, next, function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

/* POST a new comment. */
router.post('/posts/:post/comments', auth, function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;

    comment.save(function(err, comment) {
        if (err) {
            return next(err);
        }

        req.post.comments.push(comment);
        req.post.save(function(err, post) {
            if (err) {
                return next(err);
            }

            res.json(comment);
        });
    });
});

/* preload comment object */
router.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);

    query.exec(function(err, comment) {
        if (err) {
            return next(err);
        }
        if (!comment) {
            return next(new Error('can\'t find comment'));
        }

        req.comment = comment;
        return next();
    });
});

/* upvote a comment. */
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
    req.comment.upvote(req.payload._id, next, function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

/* downvote a comment. */
router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
    req.comment.downvote(req.payload._id, next, function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    });
});

/* register a new user */
router.post('/register', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            message: 'Please fill out all fields'
        });
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password)

    user.save(function(err) {
        if (err) {
            return res.status(400).json({
                message: 'Username already exists'
            });
        }

        return res.json({
            token: user.generateJWT()
        })
    });
});

/* login a user */
router.post('/login', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({
            message: 'Please fill out all fields'
        });
    }

    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }

        if (user) {
            return res.json({
                token: user.generateJWT()
            });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

module.exports = router;