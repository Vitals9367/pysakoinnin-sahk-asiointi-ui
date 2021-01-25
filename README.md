# example-profile-ui

Example UI application interacts with an OIDC (and later also with Helsinki profile).

App uses oidc-react.js for all calls to the OIDC provider. That library is wrapped with "client.ts" to support Tunnistamo and Keycloak servers which for example return different data formats.

Included in this demo app:

- hooks for easy usage
- redux store listening a client
- HOC component listening a client and showing different content for authorized and unauthorized users.

Clients dispatch events and trigger changes which then trigger re-rendering of the components using clients.

## Oidc and keyclock client differences

Client libraries trigger different events when client status changes or an error occurs.

CLIENT_READY:

- oidc does not trigger this event. Keycloak triggers this when onReady() is called. This is same as either AUTHORIZE or UNAUTHORIZED event.
  TOKEN_EXPIRING:
- triggered only by oidc
  ERROR event with type AUTH_ERROR:
- Oidc trigger the event if silent signin results in error, but not if error is 'login_required'. Keycloak triggers this error when onAuthError() is called

## Config

use .env -files. Config can also be overridden for command line:

```bash
REACT_APP_OIDC_URL=https://foo.bar yarn start
```

### Config for Keycloak OIDC provider

Default OIDC-server is Tunnistamo and .env is set up for it.

Settings when using keycloak server:

```bash
REACT_APP_OIDC_URL="https://helsinki-profile-keycloak-dev.agw.arodevtest.hel.fi/auth"
REACT_APP_OIDC_REALM="helsinki-tunnistus"
REACT_APP_OIDC_SCOPE="profile"
REACT_APP_OIDC_CLIENT_ID="exampleapp-ui"
```

Tunnistamo does not support silent login checks (it uses only localstorage) so REACT_APP_OIDC_AUTO_SIGN_IN must be 'false'. It renews access tokens so REACT_APP_OIDC_SILENT_AUTH_PATH must be changed to '/' to prevent errors for unknown redirect url.

### Config for getting Profile data

Use same config as above with Tunnistamo and add

```bash
REACT_APP_OIDC_CLIENT_ID="exampleapp-ui"
REACT_APP_OIDC_SCOPE="openid profile email https://api.hel.fi/auth/helsinkiprofile"
```

Profile BE url and audience are configured in main .env and there is no need to change them

```bash
REACT_APP_PROFILE_BACKEND_URL="https://profiili-api.test.kuva.hel.ninja/graphql/"
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
