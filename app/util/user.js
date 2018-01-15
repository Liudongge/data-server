const axios = require('axios')
const APPID = ''
const SECRET = ''
let global_access_token = '' // 基础支持的access_token，通用，两小时过期
let time_checker = new Date() // 判断基础access_token是否过期的时间基点

/**
 * 根据页面静默授权获取到的用户code，得到微信用户的信息，如姓名，头像等
 * @param  {string} code 微信用户授权code：code作为换取access_token的票据
*                        每次用户授权带上的code将不一样，code只能使用一次，5分钟未被使用自动过期。
 * @return {object}      用户信息
 */
exports.getUserInfo = code => {
  let nowTime = new Date() // 当前时间，用于判断基础token是否过期
  let global_authAccessInfo = {} // 储存获取到的验证信息
  // 初次获取或者距离上次获取时间已超过一个半小时，再次获取基础access_token
  if (global_access_token === '' || (nowTime - time_checker) > 5400000) {
    return accessTokenRefresh().then(() => {
      return getAccessTokenForInfo(code)
    }).then(authAccessInfo => {
      global_authAccessInfo = authAccessInfo
      return tokenExpires(authAccessInfo)
    }).then(flag => {
      if (flag === false) {
        return getRefreshToken(global_authAccessInfo)
      } else {
        return getUserInfo(global_authAccessInfo)
      }
    }).then(userInfo => {
      return userInfo
    }).catch(err => {
      console.error(err)
    })
  } else {
    // 传参code
    return getAccessTokenForInfo(code).then(authAccessInfo => {
      global_authAccessInfo = authAccessInfo
      return tokenExpires(authAccessInfo)
    }).then(flag => {
      if (flag === false) {
        return getRefreshToken(global_authAccessInfo)
      } else {
        return getUserInfo(global_authAccessInfo)
      }
    }).then(userInfo => {
      return userInfo
    }).catch(err => {
      console.error(err)
    })
  }
}
/**
 * 通过code换取网页授权access_token
 * @param  {string} code 微信用户授权code
 * @return {object}      包含access_token和openid的对象
 */
const getAccessTokenForInfo = code => {
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?APPID=${APPID}&SECRET=${SECRET}&code=${code}&grant_type=authorization_code`
  return axios.get(url).then(res => {
    if (res.status === 200) {
      if (res.data.errcode) return Promise.reject(new Error(res.data.errmsg))
      return Promise.resolve(res.data)
    }
    return Promise.reject(new Error('调用微信access_token接口失败'))
  })
}
/**
 * 检验授权凭证(access_token)是否有效
 * @param  {object} authAccessInfo 检验对象，包含access_token和openid
 * @return {boolean}               true: 有效； false: 无效
 */
const tokenExpires = authAccessInfo => {
  const url = `https://api.weixin.qq.com/sns/auth?access_token=${authAccessInfo.access_token}&openid=${authAccessInfo.openid}`
  return axios.get(url).then(res => {
    if (res.status === 200) {
      if (res.data.errcode === 0) {
        // access_token仍有效，可以继续使用
        return Promise.resolve(true)
      } else {
        // access_token无效，需再次刷新获取
        return Promise.resolve(false)
      }
    }
    // 调用微信接口异常时，再次调用
    console.log('再次检测token是否过期')
    tokenExpires(authAccessInfo) // 再次获取
  })
}
/**
 * 根据refresh_token重新获取验证信息
 * @param  {object} authAccessInfo 旧验证信息，包含refresh_token
 * @return {}                      获取完刷新后的验证信息后，直接调用getUserInfo去获取用户信息
 */
const getRefreshToken = authAccessInfo => {
  const url = `https://api.weixin.qq.com/sns/oauth2/refresh_token?APPID=${APPID}&grant_type=refresh_token&refresh_token=${authAccessInfo.refresh_token}`
  return axios.get(url).then(res => {
    if (res.status === 200) {
      if (res.data.errcode) return Promise.reject(new Error(res.data.errmsg))
      // 调用getUserInfo去获取用户信息
      getUserInfo(res.data)
    }
    return Promise.reject(new Error('调用微信refresh_token接口失败'))
  })
}

/**
 * 获取access_token和openid获取用户信息
 * @param  {object} authAccessInfo 验证对象，包含access_token和openid
 * @return {object}                用户信息
 */
const getUserInfo = authAccessInfo => {
  console.log('global_access_token',global_access_token)
  const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${global_access_token}&openid=${authAccessInfo.openid}&lang=zh_CN`
  return axios.get(url).then(res => {
    if (res.status === 200) {
      if (res.data.errcode) return Promise.reject(new Error(res.data.errmsg))
      console.log('获取微信用户信息成功：', res.data)
      return Promise.resolve(res.data)
    }
    return Promise.reject(new Error('调用微信userinfo接口失败'))
  })
}

/**
 * 获取或刷新基础access_token
 * @return 给global_access_token赋值
 */
const accessTokenRefresh = () => {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
  return axios.get(url).then(res => {
    if (res.status === 200) {
      if (res.data.errcode) return Promise.reject(new Error(res.data.errmsg))
      console.log('获取基础access_token成功', new Date())
      global_access_token = res.data.access_token
      time_checker = new Date()
      return Promise.resolve('获取基础access_token成功')
    }
    return Promise.reject(new Error('调用微信userinfo接口失败'))
  })
}
