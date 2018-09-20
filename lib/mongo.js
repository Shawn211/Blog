const moment = require('moment')
const objectIdToTimestamp = require('objectid-to-timestamp')
const config = require('config-lite')(__dirname)
const Mongolass = require('mongolass')
const mongolass = new Mongolass()
mongolass.connect(config.mongodb)

mongolass.plugin('addCreatedAt', {
    afterFind: function(results){
        results.forEach(function(item){
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm')
        })
        return results
    },

    afterFindOne: function(result){
        if(result){
            result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm')
        }
        return result
    }
})

exports.User = mongolass.model('User', {
    name: {type: 'string', required: true},
    password: {type: 'string', required: true},
    avatar: {type: 'string', required: true},
    gender: {type: 'string', enum: ['m', 'f', 'x'], required: true},
    bio: {type: 'string', required: true},
    // favourite: {type: Mongolass.Types.Mixed, default: []}
})
exports.User.index({name: 1}, {unique: true}).exec()  // 根据用户名找到用户，用户名全局唯一

exports.Post = mongolass.model('Post', {
    author: {type: Mongolass.Types.ObjectId, required: true},
    title: {type: 'string', required: true},
    content: {type: 'string', required: true},
    pv: {type: 'number', default: 0},
    commentsCount: {type: 'number', default: 0},
    favouritesCount: {type: 'number', default: 0},
    hide: {type: 'number', enum: [0, 1], default: 0},
    // favourite: {type: Mongolass.Types.Mixed, default: []}
})
exports.Post.index({author: 1, _id: -1}).exec()

exports.Comment = mongolass.model('Comment', {
    author: {type: Mongolass.Types.ObjectId, required: true},
    content: {type: 'string', required: true},
    postId: {type: Mongolass.Types.ObjectId, required: true}
})
exports.Comment.index({postId: 1, _id: 1}).exec()

exports.Favourite = mongolass.model('Favourite', {
    name: {type: 'string', required: true},
    postId: {type: Mongolass.Types.ObjectId, required: true}
})
exports.Favourite.index({postId: 1, _id: -1}).exec()  // 根据收藏顺序降序(最新)查看收藏文章