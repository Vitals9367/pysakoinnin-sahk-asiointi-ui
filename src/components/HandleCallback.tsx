import React from 'react';

import { useLocation } from 'react-router';
import config from '../config';
import OidcCallback from '../client/OidcCallback';
import { getClient } from '../client/oidc-react';
import { ClientProps } from '../client';

const HandleCallback = (
  props: React.PropsWithChildren<unknown>
): React.ReactElement => {
  const location = useLocation();
  const client = getClient();
  const { children } = props;
  const isCallbackUrl = config.isCallbackUrl(location.pathname);
  if (!client.isAuthenticated() && isCallbackUrl) {
    const configFromRoute = config.getConfigFromRoute(
      location.pathname
    ) as ClientProps;
    return (
      <OidcCallback
        successRedirect={configFromRoute.path}
        failureRedirect="/authError"
      />
    );
  }
  return <>{children}</>;
};

export default HandleCallback;
