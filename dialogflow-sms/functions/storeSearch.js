exports.handler = async function (context, event, callback) {
    const request = require('request');
    const base = require('airtable').base('appyKjw2rPyzxCufn');

    const inputZip = event.sessionInfo.parameters.zip_code;
    const session_name = event.sessionInfo.session;
    
    console.log('inputZip from DialogFlow', inputZip);

    // query Airtable Stores table to get all the store records
    base('Stores').select({
        view: 'Grid view'
    }).firstPage(function (err, records) {
        if (err) {
            // Handle any errors from Airtable API call
            jsonResponse = returnError(err)
            return callback(null, jsonResponse);
        }
        
        // Create a comma separated list of zip codes from all the stores
        let zipCodes = records.map(storeResult => (storeResult.fields.Zip)).join(",");
        let closestStoreZip = null;

        // Call zipcodeapi.com's API to compute the distance from the input Zip and the zip of all the stores
        request('https://www.zipcodeapi.com/rest/' + context.ZIPCODEAPI_KEY + '/multi-distance.json/' + inputZip + '/' + zipCodes + '/mile', { json: true }, (err, res, body) => {
            if (err) {
                // handle any errors from zipcodeapi
                jsonResponse = returnError(err)
                return callback(null, jsonResponse);
            }
            let distances = body.distances;
            // Create sorted list of zip codes and distance to input zip code (ascending to closest zip is first)
            let closestStoreObj = Object.keys(distances)
                .map(key => ({ [key]: distances[key] }))
                .sort((a, b) => a[1] - b[1])[0];

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

async function returnError(err) {
    console.error(err);
    return {
        // build JSON response to webhook with text that will be sent to user if there is an error
        fulfillment_response: {
            messages: [
                {
                    text: {
                        text: ["There was an error locating stores, let me forward you to soomeone who can assist"]
                    }
                }
            ]
        }
    };
    // TODO redirect to agent
}