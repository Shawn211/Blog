const Favourite = require('../lib/mongo').Favourite

module.exports = {
    create: function create(favourite){
        return Favourite.create(favourite).exec()
    },

    delFavouriteById: function delFavouriteById(favouriteId){
        return Favourite.deleteOne({_id: favouriteId}).exec()
    },

    getFavourites: function getFavourites(name, postId){
        const query = {}
        if(name){query.name = name}
        if(postId){query.postId = postId}
        return Favourite
            .find(query)
            .populate({path: 'author', model: 'User'})
            .sort({_id: -1})
            .addCreatedAt()
            .exec()
    }
}