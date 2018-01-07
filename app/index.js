const express = require('express')
const serveStatic = require('serve-static')
const logger = require('./util/logger')
const bodyParser = require('body-parser')
const apiRouter = require('./router/api')
const compression = require('compression')

const app = express()
// 允许被跨域访问
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1')
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});
// gzip 压缩
app.use(compression())

// 访问日志
app.use(logger.access)

// 解析请求体数据
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({
  extended: false,
  limit: '50mb'
}))

// 静态服务器目录
app.use(serveStatic('public'))

// 接口
app.use('/api', apiRouter)

module.exports = app
