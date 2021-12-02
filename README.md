# Twilio-Dialogflow-SMS
Integrating a Dialogflow bot with Twilio Programmable SMS

# Installation 

## Twilio Function 
Change into the "dialogflow-sms" directory
```cd dialogflow-sms```

Rename the ".env.SAMPLE" file to .env and fill in the proper values from Twilio, Airtable and Google. 
```
ACCOUNT_SID=
AUTH_TOKEN=
AIRTABLE_API_KEY=
DIALOGFLOW_CX_LANGUAGE_CODE=en
DIALOGFLOW_CX_PROJECT_ID=
DIALOGFLOW_CX_LOCATION=us-east1
DIALOGFLOW_CX_AGENT_ID=
ZIPCODEAPI_KEY=
```

### Run a basic deployment with default settings
Deploy the project to the dev environment
```twilio serverless:deploy --environment stage```

### Use the /storeSearch URL for your Webhook
Change the URL of your DialogFlow CX Webhook to the URL of the /storeSearch function