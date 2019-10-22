const https = require('https');
const axios = require('axios');
const qs = require('querystring')

const hostname = 'localhost';
const port = '9443';
const tokenPort = '8243';
const version = 'v0.14';

const adminUsername = 'admin';
const adminPassword = 'admin';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function registerClient() {
    try {
        //#region client-registation
        var clientRegData = {
            callbackUrl: 'www.google.lk',
            clientName: 'rest_api_store',
            owner: 'admin',
            grantType: 'password refresh_token',
            saasApp: true
        };
        
        let clientRegResp = await axios.post(
			`https://${hostname}:${port}/client-registration/${version}/register`,
			clientRegData,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization:
						'Basic ' +
						new Buffer(
							adminUsername +
								':' +
								adminPassword
						).toString('base64')
				}
			}
		);
        // console.log('\n\n\n Client Registration \n\n');
        // console.log(clientRegResp.data);
        //#endregion
        //#region access-token
        var accessTokenData = {
            grant_type: 'password',
            username: adminUsername,
            password: adminPassword,
            scope: 'apim:subscribe apim:api_create apim:api_view apim:api_publish'
        };
        
        var accessTokenResp = await axios.post(
			`https://${hostname}:${tokenPort}/token`,
			qs.stringify(accessTokenData),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization:
						'Basic ' +
						new Buffer(
							clientRegResp.data.clientId +
								':' +
								clientRegResp.data.clientSecret
						).toString('base64')
				}
			}
		);

        // console.log('\n\n\n Access Token \n\n');
        // console.log(accessTokenResp.data);
        //#endregion
        //#region list apis
        var apiResp = await axios.get(
			`https://${hostname}:${port}/api/am/publisher/${version}/apis?expand=true`,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + accessTokenResp.data.access_token
				}
			}
		);
        
        // console.log('\n\n\n List APIs \n\n');
        // console.log(apiResp.data);
        //#endregion
        let apis = [];
        apiResp.data.list.forEach(element => {
            if (element.status === 'PUBLISHED' && element.visibility === 'RESTRICTED') {
                apis.push(element.id);
                // console.log(element.id);
            }
        });

        apis.forEach(element => {
            console.log(`publishing ${element}`);
            axios
				.post(
					`https://${hostname}:${port}/api/am/publisher/${version}/apis/change-lifecycle?apiId=${element}&action=Publish`,
					null,
					{
						headers: {
							'Content-Type': 'application/json',
							Authorization:
								'Bearer ' + accessTokenResp.data.access_token
						}
					}
				)
				.catch((error) => {
					console.error('Error occured while changing life-cycle for :: ' + element);
				});
        });
    } catch (error) {
        // console.error(error);
    }
}

registerClient();