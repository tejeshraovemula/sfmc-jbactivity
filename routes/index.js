'use strict';

// Deps
var activity = require('./activity');

/*
 * GET home page.
 */
exports.index = function(req, res){
    
    if( !req.session.token ) {
        console.log("Rendering Index Page1"); 
        res.send('<h1>Welcome to the public page</h1>');
    } else {
        console.log("Rendering Index Page2");
        res.send('<h1>Welcome to the public page2</h1>');
        
    }
};

exports.login = function( req, res ) {
    console.log( 'req.body: ', req.body ); 
    res.redirect( '/' );
};

exports.logout = function( req, res ) {
    req.session.token = '';
};
