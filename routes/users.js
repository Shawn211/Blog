const fs = require('fs')
const path = require('path')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkLogin = require('../middlewares/check').checkLogin

router.get('/:author/edit', checkLogin, function(req, res, next){
    const author = req.params.author
    const user = req.session.user

    UserModel.getUserById(author)
        .then(function(editUser){
            if(!editUser){
                throw new Error('该用户不存在')
            }
            if(editUser._id.toString() !== user._id.toString()){
                throw new Error('权限不足')
            }
            res.render('useredit', {
                editUser: editUser
            })
        })
        .catch(next)
})

router.post('/:author/edit', checkLogin, function(req, res, next){
    const author = req.params.author
    const user = req.session.user
    const name = req.fields.name
    const gender = req.fields.gender
    let avatar = req.files.avatar.path.split(path.sep).pop()
    const bio = req.fields.bio
    
    try{
        if(!(name.length >= 1 && name.length <= 10)){
            throw new Error('名字请限制在 1-10 个字符')
        }
        if(['m', 'f', 'x'].indexOf(gender) === -1){
            throw new Error('性别只能是 m、f 或 x')
        }
        if(!(bio.length >= 1 && bio.length <= 30)){
            throw new Error('个人简介请限制在 1-30 个字符')
        }
    }catch(e){
        fs.unlink(req.files.avatar.path, function(err){if(err) throw err})
        req.flash('error', e.message)
        return res.redirect(`/users/${author}/edit`)
    }

    UserModel.getUserById(author)
        .then(function(editUser){
            if(!editUser){
                throw new Error('该用户不存在')
            }
            if(editUser._id.toString() !== user._id.toString()){
                throw new Error('权限不足')
            }
            if(!req.files.avatar.name){
                fs.unlink(req.files.avatar.path, function(err){if(err) throw err})
                avatar = editUser.avatar
            }
            let updatingUser = {
                name: name,
                password: editUser.password,
                gender: gender,
                bio: bio,
                avatar: avatar
            }
            UserModel.updateUserByName(editUser.name, updatingUser)
                .then(function(){
                    updatingUser._id = editUser._id
                    delete updatingUser.password
                    req.session.user = updatingUser
                    // 若用户重新上传头像，则删除用户之前使用的头像
                    if(req.files.avatar.name){
                        unlinkPaths = req.files.avatar.path.split(path.sep)
                        unlinkPaths.pop()
                        unlinkPath = unlinkPaths.join(path.sep)
                        fs.unlink(unlinkPath+path.sep+editUser.avatar, function(err){if(err) throw err})
                    }
                    req.flash('success', '编辑资料成功')
                    res.redirect(`/posts?author=${author}`)
                })
                .catch(function(e){
                    fs.unlink(req.files.avatar.path, function(err){if(err) throw err})
                    if(e.message.match('duplicate key')){
                        req.flash('error', '用户名已被占用')
                        return res.redirect(`/users/${author}/edit`)
                    }
                    next(e)
                })
        })
})

module.exports = router