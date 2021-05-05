import React from 'react';
import { Switch, Route } from 'react-router';

import Index from './pages/Index';
import ApiAccessTokens from './pages/ApiAccessTokens';
import Tokens from './pages/Tokens';
import ProfilePage from './pages/ProfilePage';
import { ClientProvider } from './client/ClientProvider';
import StoreProvider from './client/redux/StoreProvider';
import Header from './components/Header';
import PageContainer from './components/PageContainer';
import config from './config';
import { setClientConfig } from './client/index';
import HandleCallback from './components/HandleCallback';

setClientConfig(config.mvpConfig);

function App(): React.ReactElement {
  return (
    <HandleCallback>
      <ClientProvider>
        <StoreProvider>
          <PageContainer>
            <Header />
            <Switch>
              <Route path={['/']} exact>
                <Index />
              </Route>
              <Route path={['/apiAccessTokens']} exact>
                <ApiAccessTokens />
              </Route>
              <Route path={['/userTokens']} exact>
                <Tokens />
              </Route>
              <Route path={['/profile']} exact>
                <ProfilePage />
              </Route>
              <Route path={['/authError']} exact>
                <div>Autentikaatio epäonnistui</div>
              </Route>
              <Route path="*">404 - not found</Route>
            </Switch>
          </PageContainer>
        </StoreProvider>
      </ClientProvider>
    </HandleCallback>
  );
}
export default App;
