# API RePublish

A simple NodeJS script to re-publish APIs using WSO2 API Manager REST APIs.

> Inrtoduced to overcome Solr indexing problems in WSO2 API Manager to re-publish APIs (re-index).
> Supports WSO2 API Manager `>= v2.5.0`

## Structure

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

3. Navigate to `/repository/conf` and edit `deployment.toml` to change the `hostname`, `port` and etc. values
4. To enable debug logs and responses recieved from the server, navigate to `/repoistory/conf/deployment.toml` and set `true` for both `debug` and `response` under the `[debug]` section
5. Execute the following command from the root folder to execute the script

   ```shell
   node server
   ```

> Execute `npm link` to link the `api-republish` package within your local enviroment so that we can invoke the package directly by executing `api-republish` command without executing the `node server` from the root directory

## Deployment TOML Configurations

### General Configurations

| Configuration  | Description  | Default  |
|---|---|---|
| hostname  | Hostname of the Publisher node  | `localhost`  |
| port  | Port of the Publisher node  | 9443  |   |   |
| km_hostname  | Hostname of the Key Manager node  | `localhost`  |
| km_port  | Port of the Key Manager node  | 9443  |
| version  | WSO2 API Manager REST API version  | `v0.14`  |
| expand  | Expand query parameter  | true  |
| limit  | Limit query parameter  | 200  |
| offset  | Offset query parameter  | 0  |
| query  | Query query parameter  | `status:PUBLISHED`  |
| username  | Username of Admin user  | `admin`  |
| password  | Password of Admin user  | `admin`  |

### Dynamic Client Registration Configurations

| Configuration  | Description  | Default  |
|---|---|---|---|---|
| callbackUrl  | Callback URL for DCR  | `www.google.lk`  |
| clientName  | Name of the DCR  | `rest_api_store`  |
| owner  | Owner of the DCR  | `admin`  |
| grantType  | Grant Types allowed  | `password refresh_token`  |
| saasApp  | Saas App  | true  |

### Access Token Configurations

| Configuration  | Description  | Default  |
|---|---|---|
| grant_type  | Grant Type used for the Access Token generation  | `password`  |
| scope  | Scopes  | `apim:subscribe apim:api_create apim:api_view apim:api_publish`  |

### Debug Log Configuration

| Configuration | Description | Default |
|--|--|--|
| debug | Enable to print Debug logs of the execution flow | false |
| response | Enable to print the Responses retrieved from the Server during the execution | false |

## Execution Process Flow

1. Registers a dynamic client
2. Generates the Access Token using Admin credentials
3. Lists all the available APIs using the Publisher API (with expanded info)
4. Filters the APIs under the following conditions
   1. Status = Published
   2. Visibility = Restricted
5. Publishes the filtered APIs
