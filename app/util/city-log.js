const fs = require('fs')
const readline = require('readline')
const bufferpack = require('bufferpack')
const IP = require('ip')

// const readFileName = './static-sit.gomemyf.com.access.log-20171218'
const readFileName = './access.test.log.log-20171218'
// const readFileName = './access_json.log'
const readFileStream = fs.createReadStream(readFileName)
let cityBuf = {}

//查询ip
const getCity = ip => {
  if (cityBuf[ip]) return cityBuf[ip] // 如果已经查询过某ip，则从cityBuf中直接返回
  var content = fs.readFileSync('./ip.dat');
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

exports.getCity = (callback) => {
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

  let logArr = []
  let lineArr = []
  // 读取目标log文件的每一行并做处理
  const objReadline = readline.createInterface({
    input: readFileStream,
    crlfDelay: Infinity
  })
  objReadline.on('line', line => {
    lineArr = line.split(' ')// nginx的log日志在服务器上格式化成json之后，可以不使用该方法，而直接读取
    if (lineArr[2]){
      logArr.push(getCity(lineArr[2].trim()))
    }
  })
  readFileStream.on('close', () => {
    callback(logArr)
  })
}
