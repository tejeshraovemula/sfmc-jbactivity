'use strict';
var util = require('util');

// Deps
const Path = require('path');
//const JWT = require(Path.join(__dirname, '..', 'lib', 'jwtDecoder.js'));
var http = require('https');

exports.logExecuteData = [];

function logData(req) {
    exports.logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path, 
        host: req.hostname,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
    console.log("body: " + util.inspect(req.body));
    console.log("body-2: " + JSON.stringify(req));
    console.log("headers: " + JSON.stringify(req.headers));
    console.log("trailers: " + req.trailers);
    console.log("method: " + req.method);
    console.log("url: " + req.url);
    console.log("params: " + util.inspect(req.params));
    console.log("query: " + util.inspect(req.query));
    console.log("route: " + JSON.stringify(req.route));
    console.log("cookies: " + req.cookies);
    console.log("ip: " + req.ip);
    console.log("path: " + req.path);
    console.log("host: " + req.hostname);
    console.log("fresh: " + req.fresh);
    console.log("stale: " + req.stale);
    console.log("protocol: " + req.protocol);
    console.log("secure: " + req.secure);
    console.log("originalUrl: " + req.originalUrl);
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = function (req, res) {

    console.log("5 -- For Edit");	
    console.log("4");	
    console.log("3");	
    console.log("2");	
    console.log("1");	
    console.log("Edited: "+req.body.inArguments[0]);    
    
    // Data from the req and put it in an array accessible to the main app.
    console.log( req.body );
    logData(req);
    //res.send(200, 'Edit');
    res.status(200).send('Edit');
};

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = function (req, res) {
    
    console.log("5 -- For Save");	
    console.log("4");	
    console.log("3");	
    console.log("2");	
    console.log("1");	
    //console.log("Saved: "+req.body.inArguments[0]);
    
    // Data from the req and put it in an array accessible to the main app.
    console.log( req.body );
    logData(req);
    //res.send(200, 'Save');
    res.status(200).send('Save');
    
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function (req, res) {

   
    console.log("Executed: "+JSON.stringify(req.user.inArguments[0]));
    
    var requestBody = req.user.inArguments[0];

   
    const to = "+91"+requestBody.to;
    const from = requestBody.messagingService;
    const body = requestBody.body;
    const contactKey = requestBody.contactKey;


    const https = require('https');

    const getToken = () => {
      return new Promise((resolve, reject) => {
    
        const tokenOptions = {
          hostname: process.env.AUTH_HOST,
          port: 443,
          path: process.env.AUTH_PATH,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'grant_type': "client_credentials",
            'client_id':process.env.CLIENT_ID,
            'client_secret':process.env.CLIENT_SECRET
          }
        };
    
        const tokenReq = https.request(tokenOptions, (tokenRes) => {
          let tokenResponseBody = '';
    
          tokenRes.on('data', (chunk) => {
            tokenResponseBody += chunk;
          });
    
          tokenRes.on('end', () => {
            if (tokenRes.statusCode === 200) {
              const tokenResponseJson = JSON.parse(tokenResponseBody);
              resolve(tokenResponseJson.access_token);
            } else {
              reject(`Failed to obtain token. Status code: ${tokenRes.statusCode},  Response: ${tokenResponseBody}`);
            }
          });
        });
    
        tokenReq.on('error', (e) => {
          reject(`Problem with token request: ${e.message}`);
        });
    
        tokenReq.end();
      });
    }; 

   
    
    const sendSMS = (accessToken) => {
      return new Promise((resolve, reject) => {
        const recordData = JSON.stringify(
          {
                "requestUUID": "REQ_" + Date.now(), 
                "To": to, 
                "From": "+16507191378",
                "Body": body
          }
        );
    
        const recordOptions = {
          hostname: process.env.API_HOST,
          port: 443,
          path: process.env.API_PATH,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Length': recordData.length
          }
        };
    
        const recordReq = https.request(recordOptions, (recordRes) => {
          let recordResponseBody = '';
    
          recordRes.on('data', (chunk) => {
            recordResponseBody += chunk;
          });
    
          recordRes.on('end', () => {
            if (recordRes.statusCode === 200 || recordRes.statusCode === 201) {
              resolve(`SMS Sent successfully. Response: ${recordResponseBody}`);
            } else {
              reject(`Failed to send SMS. Status code: ${recordRes.statusCode}, Response: ${recordResponseBody}`);
            }
          });
        });
    
        recordReq.on('error', (e) => {
          reject(`Problem with record request: ${e.message}`);
        });
    
        recordReq.write(recordData);
        recordReq.end();
      });
    };
    
    getToken()
      .then((accessToken) => {
        console.log('Access Token:', accessToken);
        return sendSMS(accessToken);
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
      });
    // FOR TESTING
    logData(req);
    //res.send(200, 'Execute');
     res.status(200).send('Execute');

   
};


/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function (req, res) {

    console.log("5 -- For Publish");	
    console.log("4");	
    console.log("3");	
    console.log("2");	
    console.log("1");	
    //console.log("Published: "+req.body.inArguments[0]);        
    
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
//     logData(req);
    // res.send(200, 'Publish');
      res.status(200).send('Publish');
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function (req, res) {
   
     console.log("Validated: "+req.headers.authorization);  
     logData(req);
     res.status(200).send('Validate');
             
      
};
