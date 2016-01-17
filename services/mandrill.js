/**
 * Created by Philip on 2016-01-13.
 */

var api = require('mandrill-api/mandrill');
var _ = require("lodash");


module.exports = function (config) {
    var client = new api.Mandrill(config.mandrill.apikey);
    return {
        send: function (recipients, done) {
            message = config.message;
            message.to = _.map(recipients, recipient => ({
                email: recipient._id
            }));

            function success(result) {
                done(null, result);
            }
            function error(err) {
                done(err);
            }

            client.messages.send({
                message: message,
                async: true
            }, success, error);
        }
    };
};