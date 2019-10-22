# API RePublish

A simple NodeJS script to re-publish APIs using WSO2 API Manager REST APIs.

> Inrtoduced to overcome Solr indexing problems in WSO2 API Manager to re-publish APIs (re-index)

## Instructions

1. Install `NodeJS` in your environment (recommended to use **`v11.14.0`**)
2. Extract the attached zip and execute the following command from the root folder to install all package dependencies

   ```shell
   npm install
   ```

3. Change the `hostname`, `port` and etc. values by editing the `server.js` file. (The constant values are at the beginning of the JS file)
4. Execute the following command from the root folder to execute the script

   ```shell
   node server
   ```

## Execution Process Flow

1. Registers a dynamic client
2. Generates the Access Token using Admin credentials
3. Lists all the available APIs using the Publisher API (with expanded info)
4. Filters the APIs under the following conditions
   1. Status = Published
   2. Visibility = Restricted
5. Publishes the filtered APIs
