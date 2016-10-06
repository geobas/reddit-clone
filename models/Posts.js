var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: false
    },
    link: String,
    author: String,
    upvotes: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    users: [{
        type: String
    }]
});

PostSchema.methods.upvote = function(_id, next, cb) {

    if (this.users.indexOf(_id) == -1) {
        this.users.push(
            _id
        );
        this.upvotes += 1;
        this.save(cb);
    } else {
        var err = new Error();
        return next(err);
    }
};

PostSchema.methods.downvote = function(_id, next, cb) {

    if (this.users.indexOf(_id) == -1 && this.upvotes > 0) {
        this.users.push(
            _id
        );
        this.upvotes -= 1;
        this.save(cb);
    } else {
        var err = new Error();
        return next(err);
    }
};

mongoose.model('Post', PostSchema);