const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const PostModel = require('../models/posts')
const CommentModel = require('../models/comments')
const FavouriteModel = require('../models/favourites')
const checkLogin = require('../middlewares/check').checkLogin

router.get('/', function(req, res, next){
    const author = req.query.author
    var page = parseInt(req.query.page  || 1)
    var rows = parseInt(req.query.rows || 10)
    let hide = false
    var favouritePostsId = []
    var postId
    if(author){
        if(req.session.user && req.session.user._id.toString() === author.toString()){
            hide = true
        }
        UserModel.getUserById(author)
            .then(function(user){
                PostModel.getPosts(author, hide)
                    .then(function(posts){
                        var pages = Math.ceil(posts.length/rows)
                        if(!req.session.user){
                            res.render('myposts', {
                                posts: posts.slice((page-1)*rows, page*rows),
                                pages: pages,
                                page: page,
                                rows: rows,
                                author: user,  // 若这里是 user ，则向 ejs 模板传递值时，会覆盖 session 里的 user ，所以命名为 author
                                type: 'posts',
                                favouritePostsId: favouritePostsId
                            })
                        }else{
                            FavouriteModel.getFavourites(req.session.user.name, postId)
                                .then(function(favourites){
                                    if(favourites.length === 0){
                                        res.render('myposts', {
                                            posts: posts.slice((page-1)*rows, page*rows),
                                            pages: pages,
                                            page: page,
                                            rows: rows,
                                            author: user,
                                            type: 'posts',
                                            favouritePostsId: favouritePostsId
                                        })
                                    }else{
                                        favourites.forEach(function(favourite){
                                            favouritePostsId.push(favourite.postId.toString())
                                            if(favouritePostsId.length === favourites.length){
                                                res.render('myposts', {
                                                    posts: posts.slice((page-1)*rows, page*rows),
                                                    pages: pages,
                                                    page: page,
                                                    rows: rows,
                                                    author: user,
                                                    type: 'posts',
                                                    favouritePostsId: favouritePostsId
                                                })
                                            }
                                        })
                                    }
                                })
                        }
                    })
                    .catch(next)
            })
    }else{
        PostModel.getPosts(author, hide)
            .then(function(posts){
                var pages = Math.ceil(posts.length/rows)
                if(!req.session.user){
                    res.render('posts', {
                        posts: posts.slice((page-1)*rows, page*rows),
                        pages: pages,
                        page: page,
                        rows: rows,
                        type: 'posts',
                        favouritePostsId: favouritePostsId
                    })
                }else{
                    FavouriteModel.getFavourites(req.session.user.name, postId)
                        .then(function(favourites){
                            if(favourites.length === 0){
                                res.render('posts', {
                                    posts: posts.slice((page-1)*rows, page*rows),
                                    pages: pages,
                                    page: page,
                                    rows: rows,
                                    type: 'posts',
                                    favouritePostsId: favouritePostsId
                                })
                            }else{
                                favourites.forEach(function(favourite){
                                    favouritePostsId.push(favourite.postId.toString())
                                    if(favouritePostsId.length === favourites.length){
                                        res.render('posts', {
                                            posts: posts.slice((page-1)*rows, page*rows),
                                            pages: pages,
                                            page: page,
                                            rows: rows,
                                            type: 'posts',
                                            favouritePostsId: favouritePostsId
                                        })
                                    }
                                })
                            }
                        })
                }
            })
            .catch(next)
    }
})

router.get('/create', checkLogin, function(req, res, next){
    res.render('create')
})

router.post('/create', checkLogin, function(req, res, next){
    const author = req.session.user._id
    const title = req.fields.title
    const hide = parseInt(req.fields.hide)
    const content = req. fields.content

    try{
        if(!title.length){
            throw new Error('请填写标题')
        }
        if(!content.length){
            throw new Error('请填写内容')
        }
    }catch(e){
        req.flash('error', e.message)
        return res.redirect('back')
    }

    let post = {
        author: author,
        title: title,
        hide: hide,
        content: content
    }

    PostModel.create(post)
        .then(function(result){
            post = result.ops[0]
            req.flash('success', '发表成功')
            res.redirect(`/posts/${post._id}`)
        })
        .catch(next)
})

router.get('/favourite', checkLogin, function(req, res, next){
    const name = req.session.user.name
    var postId
    var page = parseInt(req.query.page  || 1)
    var rows = parseInt(req.query.rows || 10)
    let posts = []
    let favouritePostsId = []

    FavouriteModel.getFavourites(name, postId)
        .then(function(favourites){
            if(favourites.length === 0){
                req.flash('error', '无收藏文章')
                // 当无收藏文章时，会自动重定位回上一个页面，而上一个页面为收藏页面时，会陷入无限重定位
                if(req.originalUrl === '/posts/favourite'){
                    return res.redirect('/posts')
                }
                return res.redirect('back')
            }else{
                var postsOrder = []
                for(var i=0; i<favourites.length; i++){
                    postsOrder[i] = favourites[i].postId.toString()
                }
            }
            let pages = Math.ceil(favourites.length/rows)
            favourites.forEach(function(favourite){
                favouritePostsId.push(favourite.postId.toString())
                posts = (new Array(favourites.length)).fill(0)
                PostModel.getPostById(favourite.postId)
                    .then(function(post){
                        posts[postsOrder.indexOf(post._id.toString())] = post
                        // forEach 内异步操作可以利用判断是否执行完成再进行下一步操作
                        if(posts.indexOf(0) === -1){
                            res.render('posts', {
                                posts: posts.slice((page-1)*rows, page*rows),
                                pages: pages,
                                page: page,
                                rows: rows,
                                type: 'favourite',
                                favouritePostsId: favouritePostsId
                            })
                        }
                    })
                    .catch(next)
            })
        })

    // UserModel.getUserByName(name)
    //     .then(function(user){
    //         const favourite = user.favourite
    //         if(favourite.length === 0){
    //             req.flash('error', '无收藏文章')
    //             // 当无收藏文章时，会自动重定位回上一个页面，而上一个页面为收藏页面时，会陷入无限重定位
    //             if(req.originalUrl === '/posts/favourite'){
    //                 return res.redirect('/posts')
    //             }
    //             return res.redirect('back')
    //         }else{
    //             var pages = Math.ceil(favourite.length/rows)
    //         }
    //         favourite.forEach(function(postId){
    //             PostModel.getPostById(postId)
    //                 .then(function(post){
    //                     posts.push(post)
    //                     // forEach 内异步操作可以利用判断是否执行完成再进行下一步操作
    //                     if(posts.length === favourite.length){
    //                         res.render('posts', {
    //                             posts: posts.slice((page-1)*rows, page*rows),
    //                             pages: pages,
    //                             page: page,
    //                             rows: rows,
    //                             type: 'favourite'
    //                         })
    //                     }
    //                 })
    //                 .catch(next)
    //         })
    //     })
})

router.get('/:postId', function(req, res, next){
    const postId = req.params.postId
    var favouritePostsId = []

    Promise.all([
        PostModel.getPostById(postId),
        CommentModel.getComments(postId),
        PostModel.incPv(postId)
    ])
    .then(function(result){
        const post = result[0]
        const comments = result[1]
        if(!post){
            throw new Error('该文章不存在')
        }
        if(req.session.user && post.author._id.toString() !== req.session.user._id.toString()){
            throw new Error('该文章已隐藏，没有权限查看')
        }

        if(!req.session.user){
            res.render('post', {
                post: post,
                comments: comments,
                favouritePostsId: favouritePostsId
            })
        }else{
            FavouriteModel.getFavourites(req.session.user.name, postId)
                .then(function(favourites){
                    if(favourites.length === 0){
                        res.render('post', {
                            post: post,
                            comments: comments,
                            favouritePostsId: favouritePostsId
                        })
                    }else{
                        favourites.forEach(function(favourite){
                            favouritePostsId.push(favourite.postId.toString())
                            if(favouritePostsId.length === favourites.length){
                                res.render('post', {
                                    post: post,
                                    comments: comments,
                                    favouritePostsId: favouritePostsId
                                })
                            }
                        })
                    }
                })
        }
    })
    .catch(next)
})

router.get('/:postId/edit', checkLogin, function(req, res, next){
    const postId = req.params.postId
    const author = req.session.user._id

    PostModel.getRawPostById(postId)
        .then(function(post){
            if(!post){
                throw new Error('该文章不存在')
            }
            if(author.toString() !== post.author._id.toString()){
                throw new Error('权限不足')
            }
            res.render('edit', {
                post: post
            })
        })
        .catch(next)
})

router.post('/:postId/edit', checkLogin, function(req, res, next){
    const postId = req.params.postId
    const author = req.session.user._id
    const title = req.fields.title
    const hide = parseInt(req.fields.hide)
    const content = req.fields.content

    try{
        if(!title.length){
            throw new Error('请填写标题')
        }
        if(!content.length){
            throw new Error('请填写内容')
        }
    }catch(e){
        req.flash('error', e.message)
        return res.redirect('back')
    }

    PostModel.getRawPostById(postId)
        .then(function(post){
            if(!post){
                throw new Error('文章不存在')
            }
            if(post.author._id.toString() !== author.toString()){
                throw new Error('没有权限')
            }
            PostModel.updatePostById(postId, {title: title, hide: hide, content: content})
                .then(function(){
                    req.flash('success', '编辑文章成功')
                    res.redirect(`/posts/${postId}`)
                })
                .catch(next)
        })
})

router.get('/:postId/remove', checkLogin, function(req, res, next){
    const postId = req.params.postId
    const author = req.session.user._id

    PostModel.getRawPostById(postId)
        .then(function(post){
            if(!post){
                throw new Error('文章不存在')
            }
            if(post.author._id.toString() !== author.toString()){
                throw new Error('没有权限')
            }
            PostModel.delPostById(postId)
                .then(function(){
                    req.flash('success', '删除文章成功')
                    res.redirect('/posts')
                })
                .catch(next)
        })
})

router.get('/:postId/hide', checkLogin, function(req, res, next){
    const postId = req.params.postId
    const author = req.session.user._id

    PostModel.getPostById(postId)
        .then(function(post){
            if(!post){
                throw new Error('文章不存在')
            }
            if(post.author._id.toString() !== author.toString()){
                throw new Error('没有权限')
            }
            if(post.hide === 0){
                PostModel.updatePostById(postId, {hide: 1})
                    .then(function(){
                        req.flash('success', '文章已隐藏')
                        res.redirect('back')
                    })
                    .catch(next)
            }else if(post.hide === 1){
                PostModel.updatePostById(postId, {hide: 0})
                    .then(function(){
                        req.flash('success', '文章已显示')
                        res.redirect('back')
                    })
                    .catch(next)
            }
        })
})

router.get('/:postId/favour', checkLogin, function(req, res, next){
    const postId = req.params.postId
    const name = req.session.user.name

    FavouriteModel.getFavourites(name, postId)
        .then(function(favourites){
            if(favourites.length === 0){
                let favourite = {
                    name: name,
                    postId: postId
                }
                FavouriteModel.create(favourite)
                    .then(function(){
                        req.flash('success', '收藏成功')
                        res.redirect('back')
                    })
                    .catch(next)
            }else{
                FavouriteModel.delFavouriteById(favourites[0]._id)
                    .then(function(){
                        req.flash('success', '取消收藏')
                        res.redirect('back')
                    })
                    .catch(next)
            }
        })

    // PostModel.getPostById(postId)
    //     .then(function(post){
    //         if(!post){
    //             throw new Error('文章不存在')
    //         }
    //         if(post.favourite.indexOf(name) === -1){
    //             post.favourite.push(name)
    //             let postFavourite = post.favourite
    //             UserModel.getUserByName(name)
    //                 .then(function(user){
    //                     user.favourite.push(postId)
    //                     let userFavourite = user.favourite
    //                     Promise.all([
    //                         PostModel.updatePostById(postId, {favourite: postFavourite}),
    //                         UserModel.updateUserByName(name, {favourite: userFavourite})
    //                     ])
    //                     .then(function(){
    //                         req.flash('success', '收藏成功')
    //                         res.redirect('back')
    //                     })
    //                     .catch(next)
    //                 })
    //         }else{
    //             post.favourite.splice(post.favourite.indexOf(name), 1)
    //             let postFavourite = post.favourite
    //             UserModel.getUserByName(name)
    //                 .then(function(user){
    //                     user.favourite.splice(user.favourite.indexOf(postId), 1)
    //                     let userFavourite = user.favourite
    //                     Promise.all([
    //                         PostModel.updatePostById(postId, {favourite: postFavourite}),
    //                         UserModel.updateUserByName(name, {favourite: userFavourite})
    //                     ])
    //                     .then(function(){
    //                         req.flash('success', '取消收藏')
    //                         res.redirect('back')
    //                     })
    //                     .catch(next)
    //                 })
    //         }
    //     })
})

module.exports = router