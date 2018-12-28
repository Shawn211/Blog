const marked = require('marked')
const Post = require('../lib/mongo').Post
const CommentModel = require('../models/comments')

// Post.plugin('addCommentsCount', {
//     afterFind: function(posts){
//         return Promise.all(posts.map(function(post){
//             return CommentModel.getCommentsCount(post._id).then(function(commentsCount){
//                 post.commentsCount = commentsCount
//                 return post
//             })
//         }))
//     },

//     afterFindOne: function(post){
//         if(post){
//             return CommentModel.getCommentsCount(post._id).then(function(commentsCount){
//                 post.commentsCount = commentsCount
//                 return post
//             })
//         }
//         return post
//     }
// })

Post.plugin('contentToHtml', {
    afterFind: function(posts){
        return posts.map(function(post){
            post.content = marked(post.content)
            return post
        })
    },
    
    afterFindOne: function(post){
        if(post){
            post.content = marked(post.content)
        }
        return post
    }
})

// Post.plugin('addFavouritesCount', {
//     afterFind: function(posts){
//         return Promise.all(posts.map(function(post){
//             let name
//             return FavouriteModel.getFavouritesCount(name, post._id).then(function(favouritesCount){
//                 post.favouritesCount = favouritesCount
//                 return post
//             })
//         }))
//     },

//     afterFindOne: function(post){
//         let name
//         return FavouriteModel.getFavouritesCount(name, post._id).then(function(favouritesCount){
//             post.favouritesCount = favouritesCount
//             return post
//         })
//     }
// })

module.exports = {
    create: function create(post){
        return Post.create(post).exec()
    },
    
    getPostById: function getPostById(postId){
        return Post
            .findOne({_id: postId})
            .populate({path: 'author', model: 'User'})
            .addCreatedAt()
            // .addCommentsCount()
            // .addFavouritesCount()
            .contentToHtml()
            .exec()
    },

    getPostByIdList: function getPostByIdList(postIdList){
        return Post
            .find({'_id': {'$in': postIdList}})
            .populate({path: 'author', model: 'User'})
            .sort({_id: -1})
            .addCreatedAt()
            .contentToHtml()
            .exec()
    },

    getPosts: function getPosts(author, hide, flt){
        const query = {}
        if(author){query.author = author}
        if(!hide){query.hide = 0}
        return Post
            .find(query)
            .skip((flt.page-1)*flt.rows)
            .limit(flt.rows)
            .populate({path: 'author', model: 'User'})
            .sort({_id: -1})
            .addCreatedAt()
            // .addCommentsCount()
            // .addFavouritesCount()
            .contentToHtml()
            .exec()
    },
    
    incPv: function incPv(postId){
        return Post
            .update({_id: postId}, {$inc: {pv: 1}})
            .exec()
    },

    incCommentsCount: function incCommentsCount(postId){
        return Post
            .update({_id: postId}, {$inc: {commentsCount: 1}})
            .exec()
    },

    decCommentsCount: function decCommentsCount(postId){
        return Post
            .update({_id: postId}, {$inc: {commentsCount: -1}})
    },

    incFavouritesCount: function incFavouritesCount(postId){
        return Post
            .update({_id: postId}, {$inc: {favouritesCount: 1}})
            .exec()
    },

    decFavouritesCount: function decFavouritesCount(postId){
        return Post
            .update({_id: postId}, {$inc: {favouritesCount: -1}})
    },

    getRawPostById: function getRawPostById(postId){
        return Post
            .findOne({_id: postId})
            .populate({path: 'author', model: 'User'})
            .exec()
    },
    
    updatePostById: function updatePostById(postId, data){
        return Post.update({_id: postId}, {$set: data}).exec()
    },

    delPostById: function delPostById(postId){
        return Post.deleteOne({_id: postId})
            .exec()
            .then(function(res){
                if(res.result.ok && res.result.n > 0){
                    return CommentModel.delCommentsByPostId(postId)
                }
            })
    },

    getPostsCount: function getPostsCount(author, hide){
        const query = {}
        if(author){query.author = author}
        if(!hide){query.hide = 0}
        return Post.countDocuments(query).exec()
    }
}