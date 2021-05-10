# Example-profile-ui

Example UI application handles logins to OIDC provider and loads Helsinki Profile. There are two types of logins: Helsinki-Profiili MVP and plain Suomi.fi. User chooses one on the index page.

App uses [oidc-react.js](https://github.com/IdentityModel/oidc-client-js/wiki) for all calls to the OIDC provider. Library is wrapped with "client" (client/index.ts) to unify connections to Tunnistamo, Keycloak server and Profiili API.

Included in this demo app:

- two login types
- hooks for easy usage with React
- redux store listening a client
- HOC component listening a client and showing different content for authorized and unauthorized users.
- getting API token and using it to get Profile (only when using Helsinki-Profiili MVP ).

Client dispatches events and trigger changes which then trigger re-rendering of the components using the client.

## Config

Configs are in .env -files. Default endpoint for Helsinki-Profiili is Tunnistamo. For Suomi.fi authentication, it is plain Keycloak.

Tunnistamo does not support silent login checks (it uses only sessionStorage) so REACT_APP_OIDC_AUTO_SIGN_IN must be 'false'. It renews access tokens so REACT_APP_OIDC_SILENT_AUTH_PATH must be changed to '/' to prevent errors for unknown redirect url.

Config can also be overridden for command line:

```bash
REACT_APP_OIDC_URL=https://foo.bar yarn start
```

### Config for Helsinki-Profiili MVP

Settings when using Helsinki-Profiili MVP authentication:

```bash
REACT_APP_OIDC_URL="<SERVER_URL>/auth"
REACT_APP_OIDC_REALM="helsinki-tunnistus"
REACT_APP_OIDC_SCOPE="profile"
REACT_APP_OIDC_CLIENT_ID="exampleapp-ui"
```

### Config for plain Suomi.fi

Settings when using plain Suomi.fi authentication:

```bash
REACT_APP_PLAIN_SUOMIFI_URL="<SERVER_URL>/auth"
REACT_APP_PLAIN_SUOMIFI_REALM="helsinki-tunnistus"
REACT_APP_PLAIN_SUOMIFI_SCOPE="profile"
REACT_APP_PLAIN_SUOMIFI_CLIENT_ID="exampleapp-ui"
```

Keys are the same, but with "\_OIDC\_" replaced by "\_PLAIN_SUOMIFI\_".

### Config for getting Profile data (Helsinki-Profiili MVP only)

Use same config as above with Tunnistamo and add

```bash
REACT_APP_OIDC_CLIENT_ID="exampleapp-ui"
REACT_APP_OIDC_SCOPE="openid profile email https://api.hel.fi/auth/helsinkiprofile"
```

Profile BE url and audience are configured in main .env and there is no need to change them

```bash
REACT_APP_PROFILE_BACKEND_URL="<PROFILE_API_SERVER_URL>/graphql/"
REACT_APP_PROFILE_AUDIENCE="https://api.hel.fi/auth/helsinkiprofile"
```

## Docker

Run `docker-compose up`

Starting docker with temporary environment variables:
Open docker-compose.yml and add new 'environment' under services/app.

Example:

```yml
services:
  app:
    environment:
      - REACT_APP_OIDC_URL=https://foo.bar
```

## Testing

### yarn test

Runs tests in watch mode

### yarn test-coverage

Runs tests with coverage outputted to console. Results are saved to /coverage Note: command is run with "CI=true". Remove this to get visually clearer results (with colors!).

### yarn test-coverage-for-sonar

Runs tests with coverage and its results are saved as an xml file by jest-sonar-reporter.
This file can be sent to Sonar with Sonar Scanner (CLI). Report is /reports
