import { ClientConfig } from './client/index';

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
): Partial<ClientConfig> {
  const url = String(window._env_[`REACT_APP_${source}_URL`]);
  const realm = String(window._env_[`REACT_APP_${source}_REALM`]);
  const tokenExchangePath =
    window._env_[`REACT_APP_${source}_TOKEN_EXCHANGE_PATH`];
  return {
    realm,
    url,
    authority: realm ? `${url}/realms/${realm}` : url,
    clientId: String(window._env_[`REACT_APP_${source}_CLIENT_ID`]),
    callbackPath: String(window._env_[`REACT_APP_${source}_CALLBACK_PATH`]),
    logoutPath: window._env_[`REACT_APP_${source}_LOGOUT_PATH`] || '/',
    silentAuthPath: window._env_[`REACT_APP_${source}_SILENT_AUTH_PATH`],
    responseType: window._env_[`REACT_APP_${source}_RESPONSE_TYPE`],
    scope: window._env_[`REACT_APP_${source}_SCOPE`],
    autoSignIn: envValueToBoolean(
      window._env_[`REACT_APP_${source}_AUTO_SIGN_IN`],
      true
    ),
    automaticSilentRenew: envValueToBoolean(
      window._env_[`REACT_APP_${source}_AUTO_SILENT_RENEW`],
      true
    ),
    enableLogging: envValueToBoolean(
      window._env_[`REACT_APP_${source}_LOGGING`],
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
} as ClientConfig;

const uiConfig: { profileUIUrl: string } = {
  profileUIUrl: String(window._env_.REACT_APP_PROFILE_UI_URL)
};

const plainSuomiFiConfig = {
  ...createConfigFromEnv('PLAIN_SUOMIFI'),
  path: '/plainsuomifi',
  label: 'pelkkä Suomi.fi autentikaatio'
} as ClientConfig;

const isCallbackUrl = (route: string): boolean =>
  route === mvpConfig.callbackPath || route === plainSuomiFiConfig.callbackPath;

const getConfigFromRoute = (route: string): ClientConfig | undefined => {
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
