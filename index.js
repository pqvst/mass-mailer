/**
 * Created by Philip on 2016-01-13.
 */

var Mailer = require("./mailer");

var mailer = new Mailer(require("./config"));
mailer.send(err => {
    console.log("err", err);
});