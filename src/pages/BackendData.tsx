import React from 'react';
import PageContent from '../components/PageContent';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import { ApiAccessTokenProvider } from '../components/ApiAccessTokenProvider';
import WithAuth from '../client/WithAuth';
import BackendDataEditor from '../components/BackendDataEditor';

const BackendData = (): React.ReactElement => (
  <PageContent>
    <ApiAccessTokenProvider>
      {WithAuth(BackendDataEditor, LoginInfo, AuthenticatingInfo)}
    </ApiAccessTokenProvider>
  </PageContent>
);

export default BackendData;
