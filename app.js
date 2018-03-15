// This loads the environment variables from the .env file
require('dotenv-extended').load();

import { RetrieveUserProfile } from 'botbuilder-facebookextension';

var builder = require('botbuilder');
var restify = require('restify');

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
    // What is your name
    function (session) {
        builder.Prompts.text(session, "What's your Name %s?",session.userData.first_name);
    },
    function (session, results, next) {
        session.dialogData.FirstName = results.response;
        next();
    },        
    function (session) {        
        // prompt for search option
        builder.Prompts.choice(
            session,
            'Hi ' + session.dialogData.FirstName + ', let me help you work out what you can afford?',
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
    RetrieveUserProfile({
        accessToken: process.env.FacebookAccessToken,
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

bot.on('conversationUpdate', function(message) {
    // Send a hello message when bot is added
    if (message.membersAdded) {
        message.membersAdded.forEach(function(identity) {
            if (identity.id === message.address.bot.id) {
                
                var reply = new builder.Message().address(message.address).text("Hi! Welcome to the BrokerChat.");                
              
                bot.send(reply);
            }
        });
    }
});