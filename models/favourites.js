const Favourite = require('../lib/mongo').Favourite

module.exports = {
    create: function create(favourite){
        return Favourite.create(favourite).exec()
    },

    delFavouriteById: function delFavouriteById(favouriteId){
        return Favourite.deleteOne({_id: favouriteId}).exec()
    },

    getFavourites: function getFavourites(name, postId, flt){
        const query = {}
        if(name){query.name = name}
        if(postId){query.postId = postId}
        if(!flt){
            return Favourite
                .find(query)
                .sort({_id: -1})
                .addCreatedAt()
                .exec()
        }
        return Favourite
            .find(query)
            .skip((flt.page-1)*flt.rows)
            .limit(flt.rows)
            .sort({_id: -1})
            .addCreatedAt()
            .exec()
    },

    getFavouritesCount: function getFavouritesCount(name, postId){
        const query = {}
        if(name){query.name = name}
        if(postId){query.postId = postId}
        return Favourite.countDocuments(query).exec()
    }
}