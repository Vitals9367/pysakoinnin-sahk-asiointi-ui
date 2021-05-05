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

function createConfigFromEnv(
  source: 'OIDC' | 'PLAIN_SUOMIFI'
): Partial<ClientProps> {
  const url = String(process.env[`REACT_APP_${source}_URL`]);
  const realm = String(process.env[`REACT_APP_${source}_REALM`]);
  const tokenExchangePath =
    process.env[`REACT_APP_${source}_TOKEN_EXCHANGE_PATH`];
  return {
    realm,
    url,
    authority: realm ? `${url}/realms/${realm}` : url,
    clientId: String(process.env[`REACT_APP_${source}_CLIENT_ID`]),
    callbackPath: String(process.env[`REACT_APP_${source}_CALLBACK_PATH`]),
    logoutPath: process.env[`REACT_APP_${source}_LOGOUT_PATH`] || '/',
    silentAuthPath: process.env[`REACT_APP_${source}_SILENT_AUTH_PATH`],
    responseType: process.env[`REACT_APP_${source}_RESPONSE_TYPE`],
    scope: process.env[`REACT_APP_${source}_SCOPE`],
    autoSignIn: envValueToBoolean(
      process.env[`REACT_APP_${source}_AUTO_SIGN_IN`],
      true
    ),
    automaticSilentRenew: envValueToBoolean(
      process.env[`REACT_APP_${source}_AUTO_SILENT_RENEW`],
      true
    ),
    enableLogging: envValueToBoolean(
      process.env[`REACT_APP_${source}_LOGGING`],
      false
    ),
    tokenExchangePath,
    hasApiTokenSupport: Boolean(tokenExchangePath)
  };
}

const mvpConfig = {
  ...createConfigFromEnv('OIDC'),
  path: '/helsinkimvp',
  label: 'Helsinki-profiili MVP'
} as ClientProps;

const uiConfig: { profileUIUrl: string } = {
  profileUIUrl: String(process.env.REACT_APP_PROFILE_UI_URL)
};

const plainSuomiFiConfig = {
  ...createConfigFromEnv('PLAIN_SUOMIFI'),
  path: '/plainsuomifi',
  label: 'pelkkä Suomi.fi autentikaatio'
} as ClientProps;

const isCallbackUrl = (route: string): boolean =>
  route === mvpConfig.callbackPath || route === plainSuomiFiConfig.callbackPath;

const getConfigFromRoute = (route: string): ClientProps | undefined => {
  if (route.length < 2) {
    return undefined;
  }
  if (route.includes(mvpConfig.path) || route === mvpConfig.callbackPath) {
    return mvpConfig;
  }
  return plainSuomiFiConfig;
};

export default {
  mvpConfig,
  ui: uiConfig,
  plainSuomiFiConfig,
  isCallbackUrl,
  getConfigFromRoute
};
