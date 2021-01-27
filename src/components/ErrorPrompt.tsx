import React, { useState } from 'react';
import { Notification } from 'hds-react';

import { useClientErrorDetection } from '../client/client';
import { ClientErrorObject, ClientError } from '../client';
import styles from './styles.module.css';

const ErrorPrompt = (
  props: React.PropsWithChildren<unknown>
): React.ReactElement | null => {
  const [dismissedError, setDismissedError] = useState<ClientErrorObject>(
    undefined
  );
  const newError = useClientErrorDetection();
  const lastErrorType = dismissedError && dismissedError.type;
  const newErrorType = newError && newError.type;
  if (lastErrorType === newErrorType) {
    return null;
  }
  const sessionEndedElsewhere =
    newErrorType === ClientError.UNEXPECTED_AUTH_CHANGE;
  const Prompt = (): React.ReactElement | null =>
    newError ? (
      <div className={styles['error-prompt-container']}>
        <div className={styles['error-prompt-content']}>
          <Notification
            label="Error"
            type="error"
            onClose={(): void => setDismissedError(newError)}
            dismissible
            closeButtonLabelText="Sulje">
            {sessionEndedElsewhere ? (
              <p>
                Käyttäjän sessio on päättynyt ilman uloskirjautumista tässä
                ikkunassa
              </p>
            ) : (
              <>
                <p>Virhekoodi: {newErrorType}.</p>
                <p>Viesti: {newError.message || ''}</p>
              </>
            )}
          </Notification>
        </div>
        <div className={styles['error-prompt-overlay']} />
      </div>
    ) : null;

  return (
    <>
      {props.children}
      <Prompt />
    </>
  );
};

export default ErrorPrompt;
