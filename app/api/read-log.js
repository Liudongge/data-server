const responseCode = require('../util/response-code')
const readLogFile = require('../util/read-log-file')
const cityLog = require('../util/city-log')

let cityInfoBuf = []
exports.cityInfo = (req, res) => {
  if (cityInfoBuf.length > 0) {
    res.json({
      code: responseCode.SUCCESS,
      cityInfo: cityInfoBuf,
      message: '获取城市信息成功'
    })
  } else {
    cityLog.getCity((info) => {
      cityInfoBuf = info
      res.json({
        code: responseCode.SUCCESS,
        cityInfo: info,
        message: '获取城市信息成功'
      })
    })
  }
}
exports.logInfo = (req, res) => {
  readLogFile.getInfoFromLog((info) => {
    res.json({
      code: responseCode.SUCCESS,
      logInfo: info,
      message: '读取log信息成功'
    })
  })
}
