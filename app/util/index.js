const crypto = require('crypto')
const http = require('http')
const path = require('path')

/**
 * 当前环境
 * @type {string}
 */
exports.env = process.env.NODE_ENV || 'development'

/**
 * 是否为开发环境
 * @type {boolean}
 */
exports.isDevelopment = exports.env === 'development'

/**
 * server 根目录
 */
exports.serverRoot = path.resolve(__dirname, '../..')

/**
 * model 长度验证
 * @param {string} label  验证字段名称
 * @param {number} min    最小长度
 * @param {number} max    最大长度
 * @returns {{args: {min: number, max: number}, message: string}}
 */
exports.validLength = (label, min, max) => {
  return {
    args: {
      min,
      max
    },
    msg: `${label}长度只能在${min}-${max}位字符`
  }
}

/**
 * md5 加密
 * @param value 需要加密的值
 * @returns {string}
 */
exports.md5 = value => {
  if (!value) return ''
  return crypto.createHash('md5').update(value).digest('hex')
}

/**
 * 错误消息处理
 * @param err 错误对象
 * @returns {*}
 */
exports.errorMessage = err => {
  if (err.errors && err.errors.length) {
    const errs = err.errors.map(item => item.message)
    return errs.length > 1 ? errs : errs.shift()
  }
  return err.message
}

/**
 * 获取状态码对应的提示
 * @param status
 * @returns {{status: *, message: *}}
 */
exports.httpMessage = status => {
  return {
    status: status,
    message: http.STATUS_CODES[status]
  }
}
