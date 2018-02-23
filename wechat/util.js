/**
 * Created by Administrator on 2018/2/23 0023.
 */
'use strict'

var xml2js = require('xml2js')
var Promise = require('bluebird')

exports.parseXMLAsync = function (xml) {
    return new Promise(function (resolve, reject) {
        xml2js.parseString(xml, {trim: true}, function (err, content) {
            if (err) reject(err)
            else resolve(content)
        })
    })
}

// formatMessage 中传入的数据有可能是嵌套的，所以要进行判断
function formatMassage(result) {
    /**
     * result 的数据格式：
     { ToUserName: [ 'gh_2be5e06aed26' ],
     FromUserName: [ 'otSeS0f072g7ueafk0Z2AIaNlhwU' ],
     CreateTime: [ '1519398727' ],
     MsgType: [ 'event' ],
     Event: [ 'subscribe' ],
     EventKey: [ '' ]
     }
     */
    var message = {}

    if (typeof result === 'object') {
        var keys = Object.keys(result)

        for (var i = 0; i < keys.length; i++) {
            var item = result[keys[i]]
            var key = keys[i]

            if (!(item instanceof Array) || item.length === 0) {
                continue
            }

            if (item.length === 1) {
                var val = item[0]

                if (typeof val === 'object') {
                    message[key] = formatMassage(val)
                }
                else {
                    message[key] = (val || '').trim()
                }
            }
            else {
                // 说明result是一个数组
                message[key] = []

                for (var j = 0; j < item.length; j++) {
                    message[key].push(formatMassage(item[j]))
                }
            }
        }
    }

    return message
}

exports.formatMessage = formatMassage