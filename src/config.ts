import { ClientProps } from './client/index';

function envValueToBoolean(
  value: string | undefined | boolean,
  defaultValue: boolean
): boolean {
  const strValue = String(value).toLowerCase();
  if (
    value === false ||
    strValue === '' ||
    strValue === 'false' ||
    strValue === '0'
  ) {
    return false;
  }
  if (value === true || strValue === 'true' || strValue === '1') {
    return true;
  }
  return defaultValue;
}

const clientConfig: ClientProps = {
  realm: String(process.env.REACT_APP_OIDC_REALM),
  url: String(process.env.REACT_APP_OIDC_URL),
  authority: process.env.REACT_APP_OIDC_REALM
    ? `${process.env.REACT_APP_OIDC_URL}/realms/${process.env.REACT_APP_OIDC_REALM}`
    : String(process.env.REACT_APP_OIDC_URL),
  clientId: String(process.env.REACT_APP_OIDC_CLIENT_ID),
  callbackPath: String(process.env.REACT_APP_OIDC_CALLBACK_PATH),
  logoutPath: process.env.REACT_APP_OIDC_LOGOUT_PATH || '/',
  silentAuthPath: process.env.REACT_APP_OIDC_SILENT_AUTH_PATH,
  responseType: process.env.REACT_APP_OIDC_RESPONSE_TYPE,
  scope: process.env.REACT_APP_OIDC_SCOPE,
  autoSignIn: envValueToBoolean(process.env.REACT_APP_OIDC_AUTO_SIGN_IN, true),
  automaticSilentRenew: envValueToBoolean(
    process.env.REACT_APP_OIDC_AUTO_SILENT_RENEW,
    true
  ),
  enableLogging: envValueToBoolean(process.env.REACT_APP_OIDC_LOGGING, false),
  tokenExchangePath: process.env.REACT_APP_OIDC_TOKEN_EXCHANGE_PATH
};

const uiConfig: { profileUIUrl: string } = {
  profileUIUrl: String(process.env.REACT_APP_PROFILE_UI_URL)
};

export default {
  client: clientConfig,
  ui: uiConfig
};
