import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'hds-react';

import PageContent from '../components/PageContent';
import config from '../config';
import styles from '../components/styles.module.css';
import { ClientConfig } from '../client';

const ConfigSelector = (): React.ReactElement => {
  const history = useHistory();
  const changeConfig = (newConfig: ClientConfig): void => {
    history.push(newConfig.path);
  };

  return (
    <PageContent>
      <h1>Kirjaudu sisään</h1>
      <div className={styles['button-container']}>
        <Button onClick={() => changeConfig(config.mvpConfig)}>
          {config.mvpConfig.label}
        </Button>
      </div>
    </PageContent>
  );
};

export default ConfigSelector;
