/**
 * Created by Philip on 2016-01-14.
 */

var fs = require("fs");
var path = require("path");
var nedb = require("nedb");
var moment = require("moment");
var async = require("async");
var _ = require("lodash");


function log(s) {
    console.log(s);
}


var Mailer = function (config) {
    this.config = config;
    this.service = require("./services/" + config.service)(config);

    // ensure jobs directory exists
    var dir = "jobs";
    if (!fs.existsSync(dir)) {
        log("creating jobs directory");
        fs.mkdirSync(dir);
    }

    // load job file (nedb)
    var file = path.join(dir, config.name);
    if (fs.existsSync(file))
        log("resuming existing job");
    else
        log("starting new job");

    // open/create job file
    this.db = new nedb({ filename: file, autoload: true });
};


Mailer.prototype.send = function (done) {
    var self = this;
    var db = this.db;
    var recps = this.config.recipients;

    async.waterfall([

        // sync recipients
        function (done) {
            async.eachSeries(recps, (recp, done) => {
                var doc = {
                    _id: recp.email,
                    vars: recp.vars,
                    sent: null
                };
                db.insert(doc, err => {
                    if (err && err.errorType == "uniqueViolated") return done();
                    done();
                });
            }, err => done(err));
        },

        function (done) {
            async.forever(
                function (next) {
                    self.sendBatch(err => {
                       next(err);
                    });
                },
                function (err) {
                    if (err === "break") err = null;
                    self.done(err);
                }
            );
        }

    ], err => {
        log(err);
    });

};


Mailer.prototype.sendBatch = function (done) {
    var self = this;
    var db = this.db;
    var service = this.service;
    var batch = this.config.batch;
    var interval = this.config.interval;

    async.waterfall([

        // count remaining recipients
        function (done) {
            db.count({ sent: null }, (err, count) => {
                if (count > 0) {
                    log("remaining recipients: " + count);
                    done(err);
                } else {
                    log("all done");
                    done("break");
                }
            });
        },

        // determine last sent
        function (done) {
            db.findOne({ sent: {$ne:null} }).sort({ sent: -1 }).exec((err, doc) => {
                if (!doc) return done();

                var next = moment(doc.sent).add(1, interval).startOf(interval);
                var now = moment();
                var secs = next.diff(now, "seconds");
                done(null, secs);
            });
        },

        // waited required time
        function (secs, done) {
            if (secs > 0) {
                log("waiting " + secs + " seconds...");
                setTimeout(done, secs * 1000);
            } else {
                log("running now");
                done();
            }
        },

        // get batch of recipients
        function (done) {
            db.find({sent: null}).limit(batch).exec((err, recipients) => {
                log("sending batch of " + recipients.length + " recipients");
                done(err, recipients);
            });
        },

        // send to batch
        function (recipients, done) {
            service.send(recipients, err => {
                done(err, recipients);
            });
        },

        function (recipients, done) {
            var ids = _.map(recipients, recipient => recipient._id);
            db.update({ _id: {$in:ids} }, { sent: new Date() }, { multi: true }, (err, num) => {
                log("updated " + num + " recipients");
                done(err);
            });
        }

    ], (err) => {
        done(err);
    });
};


module.exports = Mailer;
