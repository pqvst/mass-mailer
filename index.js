/**
 * Created by Philip on 2016-01-13.
 */


//var mandrill = require("./services/mandrill");
var fs = require("fs");
var path = require("path");


/**
 *
 * @param {Object} opts
 * @param {string} opts.job Name of the job
 * @param {string} opts.service
 * @param {Array} opts.recipients
 * @param opts.message
 * @param opts.batch
 * @param opts.rate
 */
function send(opts, done) {

    if (!opts)
        opts = {};
    if (!opts.job)
        return done(new Error("you must specify a job name"));
    if (!opts.service)
        return done(new Error("you must specify a service to use (e.g. mandrill, ses, sendgrid)"));
    if (!opts.recipients)
        return done(new Error("you must specify a list of recipients"));


    // ensure jobs directory exists
    var dir = "jobs";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }


    // ensure job doesn't already exist
    var file = path.join(dir, opts.job);
    if (opts.resume) {
        if (!fs.existsSync(file))
            return done(new Error("can't resume non-existant job: " + opts.job));
    } else {
        if (!fs.existsSync(file))
            fs.mkdirSync(file);
        else
            return done(new Error("job " + opts.job + " already exists. did you mean to resume?"));
    }

}

send({
    job: "foo",
    service: "mandrill",
    recipients: []
}, function (err) {
    if (err) throw err;
});