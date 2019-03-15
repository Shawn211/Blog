'use strict'

let config = {
    project: {
        name: 'Unblog'
    }
}

if (process.env.NODE_ENV === 'production') {
    config = Object.assign(config, require('./production.js'))
} else if (process.env.NODE_ENV === 'development') {
    config = Object.assign(config, require('./development.js'))
} else {
    config = Object.assign(config, require('./development.js'))
}

module.exports = config