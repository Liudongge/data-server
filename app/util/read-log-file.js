const fs = require('fs')
const readline = require('readline')
const bufferpack = require('bufferpack')
const IP = require('ip')

const readFileName = './static/access_json.log'
const readFileStream = fs.createReadStream(readFileName)
let cityBuf = {}

//查询ip
const getCity = ip => {
  if (cityBuf[ip]) return cityBuf[ip] // 如果已经查询过某ip，则从cityBuf中直接返回
  var content = fs.readFileSync('./static/ip.dat');
  var offset = bufferpack.unpack('L(len)', content.slice(0, 4));
  if (!offset.len || offset.len < 4) {
    throw new Error('无法解析的ip库');
  }
  var index = content.slice(4, 4 + offset.len - 4);
  if (!ip) {
    throw new Error('请传入合法ip');
  }
  var ipdot = ip.split('.');
  if (ipdot[0] < 0 || ipdot[0] > 255 || ipdot.length != 4) {
    return null;
  }
  var ip2 = bufferpack.pack('L', [IP.toLong(ip)]);
  var tmp_offset = parseInt(ipdot[0]) * 4;
  var start = bufferpack.unpack('<L(len)', index.slice(tmp_offset, tmp_offset + 4));
  var index_offset, index_length;
  var max_comp_len = offset['len'] - 1024 - 4;
  for (var s = start['len'] * 8 + 1024; s < max_comp_len; s += 8) {
    if (index.slice(s, s + 4).compare(ip2) >= 0) {
      index_offset = bufferpack.unpack('<L(len)', Buffer.concat([index.slice(s + 4, s + 7), new Buffer([0x00])]));
      index_length = bufferpack.unpack('B(len)', index.slice(s + 7, s + 8));
      break;
    }
  }
  if (!index_offset) {
    return null;
  }
  var sk = offset.len + index_offset.len - 1024;
  var area = content.slice(sk, sk + index_length.len).toString().split("\t");
  let cityObj = {}
  cityObj.country = area[0]
  cityObj.province = area[1]
  cityObj.city = area[2]
  cityObj.district = area[3]
  cityBuf[ip] = cityObj
  return cityObj
}

exports.getInfoFromLog = (callback) => {
  /**
   * 读取目标log文件并返回给方法调用者
   */
  // fs.readFile(readFileName, 'UTF-8', (err, data) => {
  //   if (err) {
  //     console.log(err)
  //     return callback('文件读取失败')
  //   } else {
  //     return callback(data)
  //   }
  // })

  let logInfoSettled = {} // 存放整理后的log信息
  let cityArr = [] // 城市信息，将转换后的城市信息依次放入数组，接口返回时再进行计数转换
  let referrerArr = [] // 原跳转链接信息
  let browserArr = [] // 浏览器信息
  let pageAnalysis = {
    whiteScreenTime: 0,
    firstScreen: 0,
    readyTime: 0,
    allloadTime: 0,
    counts: 0 // 统计页面被访问次数
  } // 时间监控

  let lineInfo = {} // 每一行log中的@fields信息
  // 读取目标log文件的每一行并做处理
  const objReadline = readline.createInterface({
    input: readFileStream,
    crlfDelay: Infinity
  })
  objReadline.on('line', line => {
    lineInfo = JSON.parse(line)['@fields']
    if (lineInfo){
      // 读取log文件中的ip地址，并转换成对应的城市信息存入cityArr
      let userIp = lineInfo.http_x_forwarded_for !== '-' ? lineInfo.http_x_forwarded_for : lineInfo.remote_addr
      cityArr.push(getCity(userIp))
      // 将http_referrer存入referrerArr
      let referrer = lineInfo.http_referrer === '-' ? '' : lineInfo.http_referrer
      referrerArr.push(referrer)

      // 浏览器信息整理，参考UserAgent.js做出模块，待完成--liudg--20180109
      // 将浏览器信息存入browserArr
      if (lineInfo.http_user_agent.indexOf('Macintosh') !== -1) {
        browserArr.push('Mac Chrome')
      } else {
        browserArr.push('Windows Chrome')
      }
      // browserArr.push(lineInfo.http_user_agent)

      // 时间监控
      let request = lineInfo.request
      if (lineInfo.request.indexOf('action=speedlog') !== -1) {
        let requestParamsStr = lineInfo.request.split(' ')[1] // /?action=speedlog&whiteScreenTime=41&firstScreen=43&readyTime=43&allloadTime=44
        let paramsStr = requestParamsStr.split('?')[1] // action=speedlog&whiteScreenTime=41&firstScreen=43&readyTime=43&allloadTime=44
        let paramsArr = paramsStr.split('&')
        let params = {}
        paramsArr.forEach(item => {
          let arr = item.split('=')
          params[arr[0]] = parseInt(arr[1]) // 字符串转成int
        })
        pageAnalysis.whiteScreenTime += params.whiteScreenTime
        pageAnalysis.firstScreen += params.firstScreen
        pageAnalysis.readyTime += params.readyTime
        pageAnalysis.allloadTime += params.allloadTime
        pageAnalysis.counts += 1
      }
    }
  })
  readFileStream.on('close', () => {
    logInfoSettled.pVisitedCounts = getProvinceCounts(cityArr)
    logInfoSettled.referrerCounts = referrerArr
    logInfoSettled.browserCounts = getCounts(browserArr)
    logInfoSettled.pageAnalysis = getAverange(pageAnalysis)
    callback(logInfoSettled)
  })
}

/**
 * 从城市列表中获取各省份出现次数
 * @param  {array} provinceArr 城市列表，每一项有国家、省份、城市、区域四个属性
 * @return {object}            每个省份出现的次数
 */
const getProvinceCounts = provinceArr => {
  if (typeof(provinceArr) !== 'object' || provinceArr.length === 0){
    return null
  } else {
    let pCountObj = {} // 省份被访问次数，结构为：[provicnce]: [counts]
    provinceArr.forEach(item => {
      pCountObj[item.province] > 0 ? pCountObj[item.province] += 1 : pCountObj[item.province] = 1
    })
    return pCountObj
  }
}

/**
 * 从数组中
 * @param  {array} arr 数组对象，格式为：[key1, key2, key3...]
 * @param  {string} key 需要从数组对象arr中获取的key
 * @return {[type]}     key出现的次数
 */
const getKeyCounts = (arr, key) => {
  if (typeof(arr) === 'object' && arr.length > 0) {
    let countsObj = {}
    arr.forEach(item => {
      countsObj[item[key]] > 0 ? countsObj[item[key]] +=1 : countsObj[item[key]] = 1
    })
    return countsObj
  } else {
    return null
  }
}


const getCounts = (arr) => {
  if (typeof(arr) === 'object' && arr.length > 0) {
    let countsObj = {}
    arr.forEach(item => {
      countsObj[item] > 0 ? countsObj[item] += 1 : countsObj[item] = 1
    })
    return countsObj
  } else {
    return null
  }
}


const getAverange = (origiObj) => {
  origiObj.whiteScreenTime = Math.floor(origiObj.whiteScreenTime / origiObj.counts)
  origiObj.firstScreen = Math.floor(origiObj.firstScreen / origiObj.counts)
  origiObj.readyTime = Math.floor(origiObj.readyTime / origiObj.counts)
  origiObj.allloadTime = Math.floor(origiObj.allloadTime / origiObj.counts)
  return origiObj
}
