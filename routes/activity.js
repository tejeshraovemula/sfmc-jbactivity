'use strict';
var util = require('util');

// Deps
const Path = require('path');
const JWT = require(Path.join(__dirname, '..', 'lib', 'jwtDecoder.js'));
var http = require('https');
const https = require('https');

exports.logExecuteData = [];

let cachedToken = null; // Store the access token
let tokenExpiryTime = 0; // Store the expiration time (in milliseconds)

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
    console.log("session: " + req.session);
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

   
    console.log("Execution Started..");
    JWT(req.body, process.env.jwtsecret, (err, decoded) => {

         // verification error -> unauthorized request
         if (err) {
             console.error(err);
             return res.status(401).end();
         }
         console.log("Decoded :"+JSON.stringify(decoded));
         if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            
             // decoded in arguments
             var requestBody = decoded.inArguments[0];
  
            const to = "+"+requestBody.to;
            const from = process.env.SENDER_PHONE;
            const body = requestBody.body;
            const contactKey = requestBody.contactKey;

             console.log('Using cached token...',cachedToken);
             console.log('Expiry',tokenExpiryTime);

            // Check if the token is cached and still valid
            if (cachedToken && Date.now() < tokenExpiryTime) {
                console.log("Using cached token...");
                sendSMS(cachedToken)
                    .then(response => {
                        console.log('SMS Sent successfully.');
                        res.status(200).json({
                            errorCode: 'SUCCESS',
                            message: response,
                            details: response
                        });
                    })
                    .catch(error => {
                        console.log('Error sending SMS:', error);
                        res.status(500).send(error);
                    });
            } else {
                // Token is either not cached or has expired, request a new one
                getToken()
                    .then(accessToken => {
                        console.log('Access Token:', accessToken);
                        cachedToken = accessToken.token; // Cache the new token
                        tokenExpiryTime = Date.now() + (accessToken.expires_in * 1000); // Set token expiry time using expires_in from response
                        return sendSMS(accessToken.token);
                    })
                    .then(response => {
                        console.log('SMS Sent successfully.');
                        res.status(200).json({
                            errorCode: 'SUCCESS',
                            message: response,
                            details: response
                        });
                    })
                    .catch(error => {
                        console.log('Error getting token or sending SMS:', error);
                        res.status(500).send(error);
                    });
            }

             const sendSMS = (accessToken) => {
              return new Promise((resolve, reject) => {
                const recordData = JSON.stringify(
                  {
                        "requestUUID": "REQ_" + Date.now(), 
                        "To": to, 
                        "From": from,
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
                console.log("Request URL: https://"+process.env.API_HOST+process.env.API_PATH);
                console.log("Req Body: "+recordData);
                recordReq.write(recordData);
                recordReq.end();
              });
            };
        
        
           /* const https = require('https');
        
            const getToken = () => {
              return new Promise((resolve, reject) => {
                const tokenData = JSON.stringify({
                  grant_type: "client_credentials",
                  client_id:process.env.CLIENT_ID,
                  client_secret:process.env.CLIENT_SECRET
                });
            
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
                console.log('Sending token request with data:', tokenData);
                //tokenReq.write(tokenData);
                tokenReq.end();
              });
            }; 
        
           
            
           
            
            getToken()
              .then((accessToken) => {
                console.log('Access Token:', accessToken);
                return sendSMS(accessToken);
              })
              .then((response) => {
                console.log('Printing Response');
                console.log(response);
                 //res.status(200).send('Execute');
                  res.status(200).json({
                                        errorCode: 'SUCCESS',
                                        message: response,
                                        details: response
                                    });
              })
              .catch((error) => {
                console.log('Printing Error');
                console.error(error);
                //res.status(500).send('Execute');
                res.status(500).send(error);
                
              });*/
            // FOR TESTING
            logData(req);
            //res.send(200, 'Execute');
             
         } else {
             console.error('inArguments invalid.');
             return res.status(400).end();
         }
     });
    
    

    // Used to decode JWT
    /* JWT(req.body, process.env.jwtSecret, (err, decoded) => {

         // verification error -> unauthorized request
         if (err) {
             console.error(err);
             return res.status(401).end();
         }

         if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            
             // decoded in arguments
             var decodedArgs = decoded.inArguments[0];
            
             logData(req);
             //res.send(200, 'Execute');
             res.status(200).send('Execute');
         } else {
             console.error('inArguments invalid.');
             return res.status(400).end();
         }
     });*/
};

/**
 * Fetch the access token if it does not exist or has expired
 */
const getToken = () => {
  return new Promise((resolve, reject) => {
    const tokenData = JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    });

    const tokenOptions = {
      hostname: process.env.AUTH_HOST,
      port: 443,
      path: process.env.AUTH_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'grant_type': "client_credentials",
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET
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
          
          // Assuming the response contains access_token and expires_in
          const accessToken = tokenResponseJson.access_token;
          const expiresIn = tokenResponseJson.expires_in; // This should be in seconds

          // Return both the token and the expires_in time
          resolve({
            token: accessToken,
            expires_in: expiresIn // The expires_in is in seconds
          });
        } else {
          reject(`Failed to obtain token. Status code: ${tokenRes.statusCode}, Response: ${tokenResponseBody}`);
        }
      });
    });

    tokenReq.on('error', (e) => {
      reject(`Problem with token request: ${e.message}`);
    });

    console.log('Sending token request with data:', tokenData);
    tokenReq.write(tokenData);
    tokenReq.end();
  });
};





/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function (req, res) {

    console.log("5 -- For Publish");	
  
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

    console.log("Validating..");	
    const token = req.body;
    console.log("Request Body: "+token);	
    JWT(req.body, process.env.jwtsecret, (err, decoded) => {

         // verification error -> unauthorized request
         if (err) {
             console.error(err);
             return res.status(401).end();
         }
         console.log("Decoded :"+JSON.stringify(decoded));
         if (decoded ) {  
             // decoded in arguments
             console.log("Decoded :"+JSON.stringify(decoded));
             logData(req);
             res.status(200).send('Execute');
         } else {
             console.error('inArguments invalid.');
             return res.status(400).end();
         }
     });
    
    
};
