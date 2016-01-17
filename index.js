/**
 * Created by Philip on 2016-01-13.
 */

var Mailer = require("./mailer");

var job = require("./example");
Mailer.create("mandrill", job, (err, mailer) => {
    mailer.start();
});

