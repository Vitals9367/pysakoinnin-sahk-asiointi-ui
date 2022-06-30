import React from 'react';

import PageContent from '../components/PageContent';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';
import LogoutInfo from '../components/LogoutInfo';
import LoggedOutInfo from '../components/LoggedOutInfo';

const LogOut = (): React.ReactElement => (
  <PageContent>
    {WithAuth(LogoutInfo, LoggedOutInfo, AuthenticatingInfo)}
  </PageContent>
);

export default LogOut;
