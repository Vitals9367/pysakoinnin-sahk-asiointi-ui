import React from 'react';
import DemoWrapper from './DemoWrapper';
import LoginInfo from './LoginInfo';
import LogoutInfo from './LogoutInfo';
import AuthenticatingInfo from './AuthenticatingInfo';
import WithAuth from '../client/WithAuth';

const Login = (): React.ReactElement => (
  <DemoWrapper title="Client-kuuntelija">
    {WithAuth(LogoutInfo, LoginInfo, AuthenticatingInfo)}
  </DemoWrapper>
);

export default Login;
