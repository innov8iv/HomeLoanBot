// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
const facebook = require('botbuilder-facebookextension');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot and listen to messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var DialogLabels = {
    Loan: 'How Much Can I Loan?',
    Repay: 'How Much Can I Repay?',
    Support: 'Support'
};

var bot = new builder.UniversalBot(connector, [
    function (session) {        
        // prompt for search option        
        builder.Prompts.choice(
            session,
            'Hi ' + session.userData.first_name + ', let me help you work out what you can afford?',
            [DialogLabels.Loan, DialogLabels.Repay],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option',
                listStyle: builder.ListStyle.button
            });
    },
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attempts :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        sendEmail('gerard.dillon@innov8iv.com','gerard.dillon@innov8iv.com',session.userData.first_name+''+session.userData.last_name+' gender:'+session.userData.gender+' locale:'+session.userData.locale+' timezone:'+session.userData.timezone+' profile pic:'+session.userData.proflie_pic,session.userData.first_name+''+session.userData.last_name+' gender:'+session.userData.gender+' locale:'+session.userData.locale+' timezone:'+session.userData.timezone+' profile pic:'+session.userData.proflie_pic);   
        // continue on proper dialog
        var selection = result.response.entity;
        switch (selection) {
            case DialogLabels.Loan:
                return session.beginDialog('How Much Can I Loan?');
            case DialogLabels.Repay:
                return session.beginDialog('How Much Can I Repay?');
        }

        session.endDialog();
    }
]);

bot.use(
    facebook.RetrieveUserProfile({
        accessToken: process.env.FacebookAccessToken,
        expireMinutes: 60, // OPTIONAL
        fields: ['first_name', 'last_name', 'gender', 'locale', 'timezone','profile_pic'] // OPTIONAL
    })    
);

bot.dialog('How Much Can I Loan?', require('./loan'));
bot.dialog('How Much Can I Repay?', require('./repayments'));
bot.dialog('support', require('./support'))
    .triggerAction({
        matches: [/help/i, /support/i, /problem/i]
    });

// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

// bot.on('conversationUpdate', function(message) {
//     // Send a hello message when bot is added
//     if (message.membersAdded) {
//         message.membersAdded.forEach(function(identity) {
//             if (identity.id === message.address.bot.id) {
                
//                 var reply = new builder.Message().address(message.address).text("Hi "+session.userData.first_name+"! Welcome to the BrokerChat.");
              
//                 bot.send(reply);
//             }
//         });
//     }
// });

var sendEmail = function(to, from, subject,content) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRIDAPI);
    const msg = {
    to: 'gerard.dillon@digicap.com.au',
    from: 'gerard.dillon@innov8iv.com',
    subject: subject,
    text: content,
    html: content,
    };
    sgMail.send(msg);
};