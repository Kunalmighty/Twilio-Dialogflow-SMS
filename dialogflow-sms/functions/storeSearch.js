const { json } = require('body-parser');

exports.handler = async function (context, event, callback) {
    const request = require('request');
    const base = require('airtable').base(context.AIRTABLE_BASE);
    
    // get the zip code and session_name from the sessionInfo passed to the webhook
    const inputZip = event.sessionInfo.parameters.zip_code;
    const session_name = event.sessionInfo.session;
    
    console.log('inputZip from DialogFlow', inputZip);

    // query Airtable Stores table to get all the store records
    base('Stores').select({
        view: 'Grid view'
    }).firstPage(function (err, records) {
        if (err) {
            console.error(body.error_msg);
            // Handle any errors from Airtable API call
            return callback(body.error_msg, null);
        }
        
        // Create a comma separated list of zip codes from all the stores
        let zipCodes = records.map(storeResult => (storeResult.fields.Zip)).join(",");

        // Call zipcodeapi.com's API to compute the distance from the input Zip and the zip of all the stores
        request('https://www.zipcodeapi.com/rest/' + context.ZIPCODEAPI_KEY + '/multi-distance.json/' + inputZip + '/' + zipCodes + '/mile', { json: true }, (err, res, body) => {
            if (body.error_code >= 400) {
                // handle any errors from zipcodeapi
                console.error(body.error_msg);
                return callback(body.error_msg, null);
            }
            let distances = body.distances;
            // Create sorted list of zip codes and distance to input zip code (ascending to closest zip is first)
            let closestStoreObj = Object.keys(distances)
                .map(key => ({ [key]: distances[key] }))
                .sort((a, b) => a[Object.keys(a)[0]] - b[Object.keys(b)[0]])[0];

            let closestStoreZip = Object.keys(closestStoreObj)[0]
            console.log('closest store zip for input zip ' + inputZip + ' is ' + closestStoreZip)
            
            // get the store record from the airtable results based on the zip code of the closest store
            let closestStore = records.filter(store => { return store.fields.Zip === closestStoreZip })[0]

            // prepare the JSON response to the webhook which sets the stores parameter to the address of the closest store(s)
            jsonResponse = {
                "session_info": {
                    "session": session_name,
                    "parameters": {
                        "stores": [(closestStore.fields.Street + " " + closestStore.fields.City + " " + closestStore.fields.State + " " + closestStore.fields.Zip)]
                    }
                }
            };
            return callback(null, jsonResponse);
        });
    });
};