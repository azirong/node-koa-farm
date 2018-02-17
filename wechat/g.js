'use strict'

var sha1 = require('sha1')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential'
}

function Wechat(opts) {
    /**
    假设服务器上有一个文件，存储旧的access_token信息和过期信息，如果票据信息过期，则重新向微信服务器读取access_token，把新的票据信息写入
    有两点要考虑，文件的读写
    g.js是中间件，只处理纯粹的和微信交互的部分，不干涉业务逻辑
    **/
    
    var that = this
    this.appID = opts.appID
    this.appsecret = opts.appsecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken

    //get方法，实现的时候是Promise形式，所以使用then
    this.getAccessToken()
        .then(function(data) {
            //票据的读取都是存在一个静态文件里的，所以取出时data是字符串形式
            try {
                data = JSON.parse(data)
            }
            catch(e) {  //捕获异常，文件不存在或不合法，此时要更新票据
                return that.updateAccessToken()    //依然是一个Promise，向下传递
            }

            //拿到票据后，检查是否在有效期内
            if (that.isValidAccessToken(data)) {
                Promise.resolve(data)
            } 
            else {
                return that.updateAccessToken()
            }
        })
        .then(function(t) {
            console.log(t)
            that.access_token = t.access_token
            that.expires_in = t.expires_in

            that.saveAccessToken(t)
        })
}

//检查access_token的有效性
Wechat.prototype.isValidAccessToken = function(data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }

    var access_token = data.access_token
    var expires_in = data.expires_in
    var nowTime = (new Date().getTime())

    if (nowTime < expires_in) {
        return true
    } 
    else {
        return false
    }
}

//更新access_token信息
Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID
    var appsecret = this.appsecret
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appsecret

    return new Promise(function(resolve, reject) {
        request({url: url, json: true}).then(function(response) {
            var data = response.body
            var nowTime = (new Date().getTime())
            var expires_in = nowTime + (data.expires_in - 20) * 1000   //考虑到网络延迟，提前20s

            data.expires_in = expires_in

            resolve(data)
        })
    })
    
}

module.exports = function (opts) {
    var wechat = new Wechat(opts)

    return function *(next) {
        var token = opts.token
        var signature = this.query.signature
        var nonce = this.query.nonce
        var timestamp = this.query.timestamp
        var echostr = this.query.echostr
        // var str = [token, timestamp, nonce].sort().join('');
        var str = [token, timestamp, nonce]
        str = str.sort().join('')
        var sha = sha1(str)

        if (sha === signature) {
            this.body = echostr + ''
        }
        else {
            this.body = 'wrong'
        }
    }
}
