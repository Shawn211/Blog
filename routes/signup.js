const express = require('express')
const router = express.Router()
const checkNotLogin = require('../middlewares/check').checkNotLogin

router.get('/', checkNotLogin, function(req, res, next){
    res.send('注册页')
})

router.post('/', checkNotLogin, function(req, res, next){
    res.send('注册')
})

module.exports = router