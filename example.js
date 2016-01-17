/**
 * Created by Philip on 2016-01-13.
 */


var test = [];
for (var i = 0; i < 1000; i++) {
    test.push({ email: i + "@foobar.com", vars: {} });
}


module.exports = {
    name: "example",
    recipients: test,
    schedule: "every 10 seconds",
    batch: 1,
    message: {
        html: "test",
        text: "test",
        subject: "This is a test",
        from_email: "test@test.com",
        from_name: "Test Test"
    },
    mandrill: {
        apikey: "..."
    }
};