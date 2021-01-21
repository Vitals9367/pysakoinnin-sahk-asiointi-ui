import React, { useContext } from 'react';
import { ClientContext } from '../clients/ClientProvider';
import LoginComponent from '../components/Login';
import PageContent from '../components/PageContent';
import ReduxConsumer from '../components/ReduxConsumer';
import WithAuthDemo from '../components/WithAuthDemo';
import ClientConsumer from '../components/ClientConsumer';

const Index = (): React.ReactElement => {
  const clientContext = useContext(ClientContext);
  return (
    <PageContent>
      {!!clientContext && clientContext.client ? (
        <>
          <h1>Client-demo</h1>
          <p>
            Tässä demossa näytetään kirjautumisikkuna ja komponentteja, jotka
            kuuntelevat muutoksia kirjautumisessa.
          </p>
          <p>
            Voit kirjautua sisään / ulos alla olevasta komponentista tai
            headerista.
          </p>
          <p>Voit myös kirjatua ulos toisessa ikkunassa.</p>
          <p>
            Client on: <strong>Oidc</strong>
          </p>
          <LoginComponent />
          <ReduxConsumer />
          <WithAuthDemo />
          <ClientConsumer />
        </>
      ) : (
        <div>Error:Clientia ei löydy contextista</div>
      )}
    </PageContent>
  );
};

export default Index;
