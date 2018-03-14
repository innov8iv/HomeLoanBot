var builder = require('botbuilder');
var Store = require('./store');
var LoanCalc = require('loan-calc');

module.exports = [

    // Value 
    function (session) {
        builder.Prompts.number(session, "How much do you want to borrow?", {
            maxRetries: 3,
            retryPrompt: 'Please enter the loan amount.'
        });
    },
    function (session, results, next) {
        if (!results.response) {
            // exhausted attemps and no selection, start over
            session.send('Oops! Too many attempts!  I\'ll set the loan amount to $250,000 for you.');
            session.dialogData.BorrowingAmount = 250000;
        }
        else
            session.dialogData.BorrowingAmount = results.response;
        next();
    },

    // Check-in
    function (session) {
        builder.Prompts.number(session, "How many years do you want to pay it back over?", {
            maxRetries: 3,
            retryPrompt: 'Please enter the number of years you want to repay over (typically 30 years)'
        });
    },
    function (session, results, next) {
        if (!results.response) {
            // exhausted attemps and no selection, start over
            session.send('Oops! Too many attempts!  I\'ll set the number of years to 30 for you.');
            session.dialogData.LoanYears = 30;
        }
        else
            session.dialogData.LoanYears = results.response;
        next();
    },

    // Nights
    function (session) {
        builder.Prompts.number(session, "What is the maximum monthly repayment you can afford?", {
            maxRetries: 3,
            retryPrompt: 'Please enter the monthly repayment amount you can afford.'
        });
    },
    function (session, results, next) {
        if (!results.response) {
            // exhausted attemps and no selection, start over
            session.send('Oops! Too many attempts!  I\'ll set the monthly repayment amount to $1,500.');
            session.dialogData.AcceptableMonthlyRepayment = 1500;
        }
        else
            session.dialogData.AcceptableMonthlyRepayment = results.response;
        next();
    },

    function (session) {
        //Calculate monthly repayments on loan amount based on interest rate of 6%
        session.dialogData.ActualMonthlyRepayment = LoanCalc.paymentCalc({
            amount: session.dialogData.BorrowingAmount,
            rate: 6,
            termMonths: session.dialogData.LoanYears*12
        });

        if (session.dialogData.ActualMonthlyRepayment <= session.dialogData.AcceptableMonthlyRepayment)
            session.send("Congratulations!  The actual monthly repayment would be approximately: $%i",session.dialogData.ActualMonthlyRepayment);
        else
            session.send("Unfortunately, the actual monthly repayment would be approximately: $%i which is $%i over the amount you believe you can afford.", session.dialogData.ActualMonthlyRepayment, session.dialogData.ActualMonthlyRepayment - session.dialogData.AcceptableMonthlyRepayment);   

        var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
        msg.addAttachment(createHeroCard(session,session.dialogData.BorrowingAmount,5.93,session.dialogData.LoanYears
            ,'NAB Variable Rate Loan 5.93'
            ,'earn 350,000 NAB Rewards Points'
            ,'https://www.nab.com.au/content/dam/nabrwd/common/target/NAB_Woman_In_Doorway_With_Dog.jpg'
            ,'https://www.nab.com.au/personal/interest-rates-fees-and-charges/interest-rates-for-home-lending#'
            ,'Talk to NAB'
        ));

        msg.addAttachment(createHeroCard(session,session.dialogData.BorrowingAmount,5.38,session.dialogData.LoanYears
            ,'Westpac Variable Rate Loan 5.38'
            ,'Offset your Rocket Repay Home Loan with your Westpac Choice account to reduce interest paid.'
            ,'https://www.nab.com.au/content/dam/nabrwd/common/target/NAB_Woman_In_Doorway_With_Dog.jpg'
            ,'https://www.westpac.com.au/personal-banking/home-loans/variable/'
            ,'Talk to Westpac'
        ));
        // attach the card to the reply message
        session.send(msg).endDialog();

    }

    // Search...
    // function (session) {
    //     var destination = session.dialogData.destination;
    //     var checkIn = new Date(session.dialogData.checkIn);
    //     var checkOut = checkIn.addDays(session.dialogData.nights);

    //     session.send(
    //         'Ok. Searching for Hotels in %s from %d/%d to %d/%d...',
    //         destination,
    //         checkIn.getMonth() + 1, checkIn.getDate(),
    //         checkOut.getMonth() + 1, checkOut.getDate());

    //     // Async search
    //     Store
    //         .searchHotels(destination, checkIn, checkOut)
    //         .then(function (hotels) {
    //             // Results
    //             session.send('I found in total %d hotels for your dates:', hotels.length);

    //             var message = new builder.Message()
    //                 .attachmentLayout(builder.AttachmentLayout.carousel)
    //                 .attachments(hotels.map(hotelAsAttachment));

    //             session.send(message);

    //             // End
    //             session.endDialog();
    //         });
    // }
];

function createHeroCard(session,loan_amount,interest_rate,term_years,loan_title,loan_subtitle,loan_image,loan_action,loan_call_to_action) {
    return new builder.HeroCard(session)
        .title(loan_title)
        .subtitle(loan_subtitle)
        .text('Monthly Repayment on $%i over %i years would be approx $%i per Month - Principal and Interest based on the advertised comparison rate of 5.93', session.dialogData.BorrowingAmount, session.dialogData.LoanYears, LoanCalc.paymentCalc({
            amount: loan_amount,
            rate: interest_rate,
            termMonths: term_years * 12
        }))
        .images([
            builder.CardImage.create(session, loan_image)
        ])
        .buttons([
            builder.CardAction.openUrl(session, loan_action, loan_call_to_action)
        ]);
};

// // Helpers
// function hotelAsAttachment(hotel) {
//     return new builder.HeroCard()
//         .title(hotel.name)
//         .subtitle('%d stars. %d reviews. From $%d per night.', hotel.rating, hotel.numberOfReviews, hotel.priceStarting)
//         .images([new builder.CardImage().url(hotel.image)])
//         .buttons([
//             new builder.CardAction()
//                 .title('More details')
//                 .type('openUrl')
//                 .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(hotel.location))
//         ]);
// }

// Date.prototype.addDays = function (days) {
//     var date = new Date(this.valueOf());
//     date.setDate(date.getDate() + days);
//     return date;
// };