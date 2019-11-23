const axios = require('axios');
const fs = require('fs');
const qs = require('querystring');
const toml = require('toml');
const winston = require('winston');

const conf = toml.parse(fs.readFileSync('./repository/conf/deployment.toml', 'utf-8'));
const log = conf.debug;

// ignore ssl verifications
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// #region winston logger configurations

/*
 *
 * specified winston logger format will contain the following pattern
 * LEVEL :: MESSAGE
 *
 * NOTE: haven't appended the time since this is executed at the client side
 *
 * two log files will be created at the time of execution
 * 1. api-republish-error.log : only contains the error logs of the server
 * 2. api-republish.log : contains both error and other levels of logs
 *
 */

const loggerFormat = winston.format.printf((info) => {
	return `${info.level} :: ${info.message}`;
});

const logger = winston.createLogger({
	format: winston.format.combine(loggerFormat),
	transports: [
		new winston.transports.File({ filename: conf.log.source + 'api-republish-error.log', level: 'error' }),
		new winston.transports.File({ filename: conf.log.source + 'api-republish.log' }),
		new winston.transports.Console({ format: winston.format.simple() }),
	],
	exitOnError: false,
});

// #endregion

logger.info(`Starting API Re-Publish`);

async function registerClient() {
	try {
		//#region client-registation

		/*
		 *
		 * following region block determines the dynamic client registration
		 * with the APIM Server to perform API Republication
		 *
		 * a request object will be developed based on the configurations and
		 * values given in the deployment.toml
		 *
		 */

		if (log.debug) logger.debug(`Registering a Dynamic Client with the Server`);

		let dcrReq = {
			callbackUrl: conf.dynamic_client_registration.callbackUrl,
			clientName: conf.dynamic_client_registration.clientName,
			owner: conf.dynamic_client_registration.owner,
			grantType: conf.dynamic_client_registration.grantType,
			saasApp: conf.dynamic_client_registration.saasApp,
		};

		let dcrResp = await axios.post(
			`https://${conf.hostname}:${conf.port}/client-registration/${conf.version}/register`,
			dcrReq,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Basic ' + new Buffer(conf.username + ':' + conf.password).toString('base64'),
				},
			}
		);

		if (log.response)
			logger.debug(`Response :: Dynamic Client Registration --------------------------------
${dcrResp.data}`);

		//#endregion

		//#region access-token

		/*
		 *
		 * following region block determines the generation of access token
		 * to perform API Republication
		 *
		 * a request object will be developed based on the configurations and
		 * values given in the deployment.toml
		 *
		 */

		if (log.debug)
			logger.debug(
				`Generating Access Token using consumerKey : ${dcrResp.data.clientId} & consumerSecret : ${dcrResp.data.clientSecret}`
			);

		let accessTokenReq = {
			grant_type: conf.access_token.grant_type,
			username: conf.username,
			password: conf.password,
			scope: conf.access_token.scope,
		};

		let accessTokenResp = await axios.post(
			`https://${conf.hostname}:${conf.tokenPort}/token`,
			qs.stringify(accessTokenReq),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization:
						'Basic ' +
						new Buffer(dcrResp.data.clientId + ':' + dcrResp.data.clientSecret).toString('base64'),
				},
			}
		);

		if (log.response)
			logger.debug(`Response :: Access Token Generation ------------------------------------
${accessTokenResp.data}`);

		//#endregion

		//#region list apis

		/*
		 *
		 * following region block is implemented to list all the available apis
		 * from the APIM Server
		 *
		 * a request object will be developed based on the configurations and
		 * values given in the deployment.toml
		 *
		 */

		if (log.debug)
			logger.debug(
				`Listing all available APIs with the generated Access Token : ${accessTokenResp.data.access_token}`
			);

		let apiResp = await axios.get(
			`https://${conf.hostname}:${conf.port}/api/am/publisher/${conf.version}/apis?expand=true`,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + accessTokenResp.data.access_token,
				},
			}
		);

		if (log.response)
			logger.debug(`Response :: API List ---------------------------------------------------
${apiResp.data}`);

		//#endregion

		if (log.debug) logger.debug(`Filtering APIs based on the Status : 'PUBLISHED' & Visibility : 'RESTRICTED'`);

		let apis = [];
		apiResp.data.list.forEach((element) => {
			if (element.status === 'PUBLISHED' && element.visibility === 'RESTRICTED') {
				if (log.debug) logger.debug(`ID = ${element.id} :: API Name = ${element.name}`);
				apis.push(element.id);
			}
		});

		apis.forEach((element) => {
			logger.info(`Re-Publishing API ID = ${element}`);
			axios
				.post(
					`https://${conf.hostname}:${conf.port}/api/am/publisher/${conf.version}/apis/change-lifecycle?apiId=${element}&action=Publish`,
					null,
					{
						headers: {
							'Content-Type': 'application/json',
							Authorization: 'Bearer ' + accessTokenResp.data.access_token,
						},
					}
				)
				.catch((_error) => {
                    logger.error(`Something went wrong while changing life-cycle for API ID = ${element}
>> `, _error);
				});
		});
	} catch (error) {
		if (error.response) {
			/**
			 * The request was made and the server responded with a
			 * status code that falls out of the range of 2xx
			 */

            logger.error(`Response recieved from the Server
>> `, error);
        }
        if (error.request) {
			/**
			 * The request was made but no response was received, `error.request`
			 * is an instance of XMLHttpRequest in the browser and an instance
			 * of http.ClientRequest in Node.js
			 */
            logger.error(`Something went wrong after sending the request to the Server
>> `, error);
            // throw new Error(error.request);
        }
        if (!error.response && !error.request) {
			// Something happened in setting up the request and triggered an Error
            logger.error(`Something went wrong
>> `, error);
		}
	}
}

registerClient();
