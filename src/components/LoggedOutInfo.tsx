import React from 'react';
import { Button } from 'hds-react';
import styles from './styles.module.css';
import { useClient } from '../client/hooks';

const LoggedOutInfo = (): React.ReactElement => {
  const { login } = useClient();
  return (
    <div className={styles['content-element']} data-test-id="logged-out-info">
      <h3>Sinut on kirjattu ulos</h3>
      <div>
        <Button onClick={login} data-test-id="login-button">
          Kirjaudu sisään
        </Button>
      </div>
    </div>
  );
};

export default LoggedOutInfo;
