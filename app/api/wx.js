const responseCode = require('../util/response-code')
const user = require('../util/user.js')

exports.user = (req, res) => {
   // '081chyih0JKyXy1gJKhh0TrBih0chyib'
  user.getUserInfo(req.code).then( info => {
    res.json({
      code: responseCode.SUCCESS,
      userInfo: user.getUserInfo(),
      message: '获取用户信息成功'
    })
  }).catch(err => {
    res.json({
      code: responseCode.ERROR,
      message: '获取用户信息失败'
    })
  })
}
