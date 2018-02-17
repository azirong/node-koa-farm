/**
 * Created by Administrator on 2018/2/16 0016.
 */
'use strict'

var Koa = require('koa')
var wechat = require('./wechat/g')
var util = require('./libs/util')
var path = require('path')
var wechat_file = path.join(__dirname, './config/wechat.txt')
var config = {
    wechat: {
        appID: 'wx9dad68746eaca383',
        appsecret: '6e79e2763ce3159f1d556795812a1a12',
        token: 'farm',
        getAccessToken: function() {
        	return util.readFileAsync(wechat_file);
        },
        saveAccessToken: function(data) {
            data = JSON.stringify(data)
        	return util.writeFileAsync(wechat_file, data);
        }
    }
}

var app = new Koa()

app.use(wechat(config.wechat))

app.listen(80)
console.log('listening: 80')