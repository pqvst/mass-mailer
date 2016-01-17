/**
 * Created by Philip on 2016-01-14.
 */

var fs = require("fs");
var path = require("path");
var nedb = require("nedb");
var moment = require("moment");
var async = require("async");
var later = require("later");
var _ = require("lodash");


function log(s) {
    console.log(s);
}


var Mailer = function () {};


module.exports.create = function (service, job, done) {
    var mailer = new Mailer();
    mailer.create(service, job, err => {
        done(err, mailer);
    });
};


Mailer.prototype.create = function (service, job, done) {
    this.job = job;
    this.service = require("./services/" + service)(job);

    // ensure jobs directory exists
    var dir = "jobs";
    if (!fs.existsSync(dir)) {
        log("creating jobs directory");
        fs.mkdirSync(dir);
    }

    // load job file (nedb)
    var file = path.join(dir, job.name);
    if (fs.existsSync(file))
        log("resuming existing job");
    else
        log("starting new job");

    // open/create job file
    this.db = new nedb({ filename: file, autoload: true });

    // sync recipients
    var recps = job.recipients;
    async.eachSeries(recps, (recp, done) => {
        var doc = {
            _id: recp.email,
            vars: recp.vars,
            sent: null
        };
        this.db.insert(doc, err => {
            if (err && err.errorType == "uniqueViolated") return done();
            done();
        });
    }, err => done(err));
};


Mailer.prototype.start = function () {
    var self = this;
    var job = this.job;
    var sched = later.parse.text(job.schedule);

    function loop() {
        console.log("next", later.schedule(sched).next());
        self.timer = later.setTimeout(function () {
            var startTime = Date.now();
            self.send(err => {
                var endTime = Date.now();
                var diff = (endTime - startTime) / 1000;

                if (err) console.log(err);

                var throughput = Math.round(job.batch / diff * 3600);
                console.log("max throughput:", throughput, "per hour");

                loop();
            });
        }, sched);
    }

    loop();

};


Mailer.prototype.stop = function () {
    this.timer.clear();
};


Mailer.prototype.send = function (done) {
    var self = this;
    var db = this.db;
    var service = this.service;
    var batch = this.job.batch;
    var interval = this.job.interval;

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

