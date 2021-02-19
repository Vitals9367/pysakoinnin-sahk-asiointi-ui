import React from 'react';
import PageContent from '../components/PageContent';
import TokenBrowser from '../components/TokenBrowser';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';

const Tokens = (): React.ReactElement => (
  <PageContent>
    {WithAuth(TokenBrowser, LoginInfo, AuthenticatingInfo)}
  </PageContent>
);

export default Tokens;
