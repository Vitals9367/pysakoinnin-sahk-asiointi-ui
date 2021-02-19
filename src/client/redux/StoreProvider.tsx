import React, { useEffect, FC } from 'react';
import { Provider } from 'react-redux';

import { store, connectClient } from './store';
import { connected } from './actions';
import { useClient } from '../hooks';

const StoreProvider: FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const client = useClient();
  useEffect(() => {
    connectClient(client);
    store.dispatch(connected(client));
  }, [client]);
  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
