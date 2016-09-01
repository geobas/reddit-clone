var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
    body: String,
    author: String,
    upvotes: {
        type: Number,
        default: 0
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    users: [{
        type: String
    }]
});

CommentSchema.methods.upvote = function(_id, cb) {

    if (this.users.indexOf(_id) == -1) {
        this.users.push(
            _id
        );
        this.upvotes += 1;
        this.save(cb);
    }
};

CommentSchema.methods.downvote = function(_id, cb) {

    if (this.users.indexOf(_id) == -1 && this.upvotes > 0) {
        this.users.push(
            _id
        );
        this.upvotes -= 1;
        this.save(cb);
    }
};

mongoose.model('Comment', CommentSchema);