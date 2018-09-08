const User = require('../lib/mongo').User

module.exports = {
    create: function create(user){
        return User.create(user).exec()
    },

    getUserByName: function getUserByName(name){
        return User
            .findOne({name: name})
            .addCreatedAt()
            .exec()
    },

    getUserById: function getUserById(id){
        return User
            .findOne({_id: id})
            .addCreatedAt()
            .exec()
    },

    updateUserByName: function updateUserByName(name, data){
        return User.update({name: name}, {$set: data}).exec()
    }
}