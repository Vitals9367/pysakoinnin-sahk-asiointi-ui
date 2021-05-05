import React from 'react';

import { useRouteMatch } from 'react-router';
import config from '../config';
import OidcCallback from '../client/OidcCallback';
import { getClient } from '../client/oidc-react';

const HandleCallback = (
  props: React.PropsWithChildren<unknown>
): React.ReactElement => {
  const client = getClient();
  const { children } = props;
  const { callbackPath } = config.client;
  const isCallbackUrl = useRouteMatch(callbackPath);
  if (!client.isAuthenticated() && callbackPath && isCallbackUrl) {
    return <OidcCallback successRedirect="/" failureRedirect="/authError" />;
  }
  return <>{children}</>;
};

export default HandleCallback;
