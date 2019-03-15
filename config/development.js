module.exports = {
    port: 8888,
    session: {
        secret: 'unblog',
        key: 'unblog',
        maxAge: 2592000000
    },
    mongodb: 'mongodb://localhost:27017/unblog',
    environment: 'development'
}