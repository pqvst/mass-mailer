/**
 * Created by Philip on 2016-01-13.
 */


var test = [];
for (var i = 0; i < 1000; i++) {
    test.push({ email: i + "@foobar.com", vars: {} });
}


module.exports = {
    name: "foo",
    recipients: test,
    batch: 10,
    interval: "minute",
    message: {
        html: "test",
        text: "test",
        subject: "This is a test",
        from_email: "test@test.com",
        from_name: "Test Test"
    },
    service: "mandrill",
    mandrill: {
        apikey: "..."
    }
};