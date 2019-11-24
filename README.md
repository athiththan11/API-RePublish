# API RePublish

A simple NodeJS script to re-publish APIs using WSO2 API Manager REST APIs.

> Inrtoduced to overcome Solr indexing problems in WSO2 API Manager to re-publish APIs (re-index).
> Supports APIM `> v2.5`

## Folder Structure

```text
|- bin
|- repository
    |- conf
        |- deployment.toml : configurations of api-republish
    |- logs
        |- api-republish-error.log : error level logs
        |- api-republish.log : combined level logs
|- server.js
```

## Instructions

1. Install `NodeJS` in your environment (recommended to use **`v11.14.0`**)
2. Extract the attached zip and execute the following command from the root folder to install all package dependencies

   ```shell
   npm install
   ```

3. Navigate to `/repository/conf` and edit `deployment.toml` to change teh `hostname`, `port` and etc. values
4. To enable debug logs and responses recieved from the server, navigate to `/repoistory/conf/deployment.toml` and set `true` for both `debug` and `response` under the `[debug]` section
5. Execute the following command from the root folder to execute the script

   ```shell
   node server
   ```

> Execute `npm link` to link the `api-republish` package within your local enviroment so that we can invoke the package directly by executing `api-republish` command without executing the `node server` from the root directory

## Execution Process Flow

1. Registers a dynamic client
2. Generates the Access Token using Admin credentials
3. Lists all the available APIs using the Publisher API (with expanded info)
4. Filters the APIs under the following conditions
   1. Status = Published
   2. Visibility = Restricted
5. Publishes the filtered APIs
