var builder = require('botbuilder');
var Store = require('./store');
var LoanCalc = require('loan-calc');

module.exports = [

    // Value 
    function (session) {
        builder.Prompts.number(session, "How much do you want to borrow?");
    },
    function (session, results, next) {
        session.dialogData.BorrowingAmount = results.response;
        next();
    },

    // Check-in
    function (session) {
        builder.Prompts.number(session, "How many years do you want to pay it back over?");
    },
    function (session, results, next) {
        session.dialogData.LoanYears = results.response;
        next();
    },

    // Nights
    function (session) {
        builder.Prompts.number(session, "What is the maximum monthly repayment you can afford?");
    },
    function (session, results, next) {
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
            session.send("Congratulations!  The actual monthly repayment would be: $"+session.dialogData.ActualMonthlyRepayment);
        else
            session.send("Unfortunately, the actual monthly repayment would be: $"+session.dialogData.ActualMonthlyRepayment);
        session.endDialog();        
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