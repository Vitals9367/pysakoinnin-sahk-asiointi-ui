import React, { useContext } from 'react';
import { Button } from 'hds-react';
import { ApiAccessTokenActions } from '../client/hooks';
import { ProfileDataType, useProfile } from '../profile/profile';
import { ApiAccessTokenContext } from './ApiAccessTokenProvider';
import styles from './styles.module.css';

const PropToComponent = ([prop, value]: [
  string,
  ProfileDataType
]): React.ReactElement => (
  <li key={prop}>
    <strong>{prop}</strong>:{' '}
    <span data-test-id={`profile-data-${prop}`}>{value}</span>
  </li>
);

const Profile = (): React.ReactElement => {
  const actions = useContext(ApiAccessTokenContext) as ApiAccessTokenActions;
  const { getStatus: getApiAccessTokenStatus } = actions;
  const {
    getStatus: getProfileStatus,
    getProfile,
    fetch,
    clear,
    getErrorMessage,
    getResultErrorMessage
  } = useProfile();
  const apiAccessTokenStatus = getApiAccessTokenStatus();
  const profileStatus = getProfileStatus();
  const profileData = getProfile();
  const resultErrorMessage = getResultErrorMessage();
  const reload = async (): Promise<void> => {
    await clear();
    await fetch();
  };
  if (apiAccessTokenStatus === 'error') {
    return <div>Api access tokenin lataus epäonnistui</div>;
  }
  if (profileStatus === 'error') {
    return (
      <div data-test-id="profile-load-error">
        Profiilin lataus epäonnistui:
        <pre>{getErrorMessage()}</pre>
      </div>
    );
  }
  if (profileStatus !== 'loaded') {
    return <div>Ladataan....</div>;
  }
  return (
    <div>
      <h2>Profiilin tiedot:</h2>
      {profileData && (
        <ul className={styles['user-token-list']}>
          {Object.entries(profileData).map(arr => PropToComponent(arr))}
        </ul>
      )}
      {resultErrorMessage && (
        <p data-test-id="profile-data-result-error">{resultErrorMessage}</p>
      )}
      <Button translate="" onClick={reload}>
        Hae
      </Button>
    </div>
  );
};

export default Profile;
