const path = require('path')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const config = require('config-lite')(__dirname)
const routes = require('./routes')
const pkg = require('./package')
const winston = require('winston')
const expressWinston = require('express-winston')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    name: config.session.key,  // 设置 cookie 中保存 session id 的字段名称
    secret: config.session.secret,  // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
    resave: true,  // 强制更新 session
    saveUninitialized: false,  // 设置为 false，强制创建一个 session，即使用户未登录
    cookie:{
        maxAge: config.session.maxAge  // 过期时间，过期后 cookie 中的 session id 自动删除
    },
    store: new MongoStore({  // 将 session 存储到 mongodb
        url: config.mongodb  // mongodb 地址
    })
}))

// flash 中间件，用来显示通知
app.use(flash())

// 处理表单及文件上传的中间件
// 使用 express-formidable 处理表单的上传，表单普通字段挂载到 req.fields 上，表单上传后的文件挂载到 req.files 上
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'),  // 上传文件目录
    keepExtensions: true  // 保留后缀
}))

// 设置模板全局常量
app.locals.blog = {
    title: pkg.name,
    description: pkg.description
}

// 添加模板必需的三个变量
app.use(function(req, res, next){
    // req.flash()执行一次就会消失
    res.locals.user = req.session.user
    res.locals.success = req.flash('success').toString()
    res.locals.error = req.flash('error').toString()
    next()
})

app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}))

// 路由
routes(app)

app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/error.log'
        })
    ]
}))

// 注意：记录正常请求日志的中间件要放到 routes(app) 之前，记录错误请求日志的中间件要放到 routes(app) 之后。

app.use(function(err, req, res, next){
    console.log(err)
    req.flash('error', err.message)
    res.redirect('/posts')
})

// 注意：中间件的加载顺序很重要。
// 如上面设置静态文件目录的中间件应该放到 routes(app) 之前加载，这样静态文件的请求就不会落到业务逻辑的路由里
// 如 flash 中间件应该放到 session 中间件之后加载，因为 flash 是基于 session 实现的。

// 监听端口，启动程序
app.listen(config.port, function(){
    console.log(`${pkg.name} listening on port ${config.port}`)
})