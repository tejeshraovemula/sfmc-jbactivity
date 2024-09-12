'use strict';

// Deps
var activity = require('./activity');

/*
 * GET home page.
 */
exports.index = function(req, res){
    console.log("request :"+req);
    if( !req.session.token ) {
        console.log("Rendering Index Page1"); 
        res.render( 'index', {
            title: 'Unauthenticated',
            errorMessage: 'This app may only be loaded via Salesforce Marketing Cloud',
        });
    } else {
        console.log("Rendering Index Page2"); 
        res.render( 'index', {
            title: 'Journey Builder Activity',
            results: activity.logExecuteData,
        });
    }
};

exports.login = function( req, res ) {
    console.log( 'req.body: ', req.body ); 
    res.redirect( '/' );
};

exports.logout = function( req, res ) {
    req.session.token = '';
};
