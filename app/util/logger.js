const log4js = require('log4js')
const util = require('../util')

const appenders = [{
  type: 'dateFile',
  filename: 'log/app',
  pattern: '-yyyy-MM-dd.log',
  alwaysIncludePattern: true,
  backups: 10,
  category: 'app'
}, {
  type: 'dateFile',
  filename: 'log/access',
  pattern: '-yyyy-MM-dd.log',
  alwaysIncludePattern: true,
  backups: 10,
  category: 'access'
}]

if (util.isDevelopment) {
  appenders.push({
    type: 'console'
  })
}

log4js.configure({
  appenders,
  replaceConsole: util.isDevelopment
})

// 访问日志
exports.access = log4js.connectLogger(log4js.getLogger('access'), {
  level: 'auto'
})

// 应用日志
exports.app = log4js.getLogger('app')
