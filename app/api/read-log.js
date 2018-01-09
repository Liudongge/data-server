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
let logInfoBuf = null // 连续多次被访问时，出现Provisional headers are shown的错误，缓存访问？IO冲突？待修改--liudg--20180109
exports.logInfo = (req, res) => {
  console.log(logInfoBuf)
  if (logInfoBuf == null) {
    readLogFile.getInfoFromLog((info) => {
      logInfoBuf = info
      res.json({
        code: responseCode.SUCCESS,
        logInfo: info,
        message: '读取log信息成功'
      })
    })
  } else {
    res.json({
      code: responseCode.SUCCESS,
      logInfo: logInfoBuf,
      message: '读取log信息成功'
    })
  }
}
