import React from 'react';
import { Route, Switch } from 'react-router';

import { ClientProvider } from './client/ClientProvider';
import StoreProvider from './client/redux/StoreProvider';
import PageContainer from './components/PageContainer';
import HandleCallback from './components/HandleCallback';
import ConfigChecker from './components/ConfigChecker';
import config from './config';
import Index from './pages/Index';
import Tokens from './pages/Tokens';
import Header from './components/Header';
import ApiAccessTokens from './pages/ApiAccessTokens';
import ProfilePage from './pages/ProfilePage';
import BackendData from './pages/BackendData';
import LogOut from './pages/LogOut';

function App(): React.ReactElement {
  const mvpPath = config.mvpConfig.path;
  return (
    <ConfigChecker>
      <HandleCallback>
        <ClientProvider>
          <StoreProvider>
            <PageContainer>
              <Header />
              <Switch>
                <Route path={[mvpPath]} exact>
                  <Index />
                </Route>
                <Route path={['/:anyPath/userTokens']} exact>
                  <Tokens />
                </Route>
                <Route path={[`${mvpPath}/apiAccessTokens`]} exact>
                  <ApiAccessTokens />
                </Route>
                <Route path={[`${mvpPath}/backend`]} exact>
                  <BackendData />
                </Route>
                <Route path={[`${mvpPath}/profile`]} exact>
                  <ProfilePage />
                </Route>
                <Route path={['/authError']} exact>
                  <div>Autentikaatio epäonnistui</div>
                </Route>
                <Route path={['/logout']} exact>
                  <LogOut />
                </Route>
                <Route path="*">404 - not found</Route>
              </Switch>
            </PageContainer>
          </StoreProvider>
        </ClientProvider>
      </HandleCallback>
    </ConfigChecker>
  );
}

export default App;
