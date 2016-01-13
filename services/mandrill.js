/**
 * Created by Philip on 2016-01-13.
 */

var config = require("../config");
var api = require('mandrill-api/mandrill');
var client = new mandrill.Mandrill(config.mandrill.apikey);


var Mandrill = module.exports = {

    send: function (message) {

        var async = true;
        var ip_pool;
        var send_at;

        var result = client.messages.send({
            message: message,
            async: async,
            ip_pool: ip_pool,
            send_at: send_at
        });

    }

};