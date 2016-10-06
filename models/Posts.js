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
    }]
});

PostSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
};

PostSchema.methods.downvote = function(cb) {
    if (this.upvotes > 0) {
        this.upvotes -= 1;
        this.save(cb);
    }
};

mongoose.model('Post', PostSchema);