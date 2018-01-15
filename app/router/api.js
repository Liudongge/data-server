const express = require('express')
const router = express.Router()
// const authMiddleware = require('../middleware/auth')
const readLogApi = require('../api/read-log')
const wxApi = require('../api/wx')

/**
 * 公开接口，不需要登录就可以调用
 */
router.get('/public/data/nginx/city', readLogApi.cityInfo) // 从log中根据ip地址获取城市信息
router.get('/public/data/nginx/logInfo', readLogApi.logInfo) // 从log文件中获取各种信息
router.get('/public/data/user', wxApi.user) // 获取用户信息接口，需要传来code

module.exports = router
