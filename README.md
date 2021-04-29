# example-profile-ui

Example UI application handles logins to OIDC provider and loads Helsinki Profile.

App uses [oidc-react.js](https://github.com/IdentityModel/oidc-client-js/wiki) for all calls to the OIDC provider. Library is wrapped with "client" (client/index.ts) to unify connections to Tunnistamo, Keycloak server and Helsinki Profiili.

Included in this demo app:

- hooks for easy usage with React
- redux store listening a client
- HOC component listening a client and showing different content for authorized and unauthorized users.
- getting API token and using it to get Profile.

Client dispatches events and trigger changes which then trigger re-rendering of the components using the client.

## Config

Configs are in .env -files. Default OIDC-server is Tunnistamo.

Tunnistamo does not support silent login checks (it uses only sessionStorage) so REACT_APP_OIDC_AUTO_SIGN_IN must be 'false'. It renews access tokens so REACT_APP_OIDC_SILENT_AUTH_PATH must be changed to '/' to prevent errors for unknown redirect url.

Config can also be overridden for command line:

```bash
REACT_APP_OIDC_URL=https://foo.bar yarn start
```

### Config for Keycloak OIDC provider

Settings when using keycloak server:

```bash
REACT_APP_OIDC_URL="<KEYCLOAK_SERVER_URL>/auth"
REACT_APP_OIDC_REALM="helsinki-tunnistus"
REACT_APP_OIDC_SCOPE="profile"
REACT_APP_OIDC_CLIENT_ID="exampleapp-ui"
```

### Config for getting Profile data

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
