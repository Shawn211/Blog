const path = require('path')
const express = require('express')
const router = express.Router()

const checkLogin = require('../middlewares/check').checkLogin

router.post('/', checkLogin, function(req, res, next){
    var form = new require('formidable').IncomingForm()
    form.uploadDir = path.join(__dirname, '..', 'public/img/pic')
    form.keepExtensions = true
    form.parse(req, function(err, fields, files){
        if(err){
            req.flash('error', err.message)
            return res.redirect('back')
        }
        var filePath = files.file.path
        var fileName = files.file.name
        var link = `![${fileName}](${filePath.split('public').pop()})`
        return res.json({
            code: 200,
            link: link
        })
    })
})

module.exports = router