import React, { useContext } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { configureClient } from '../../client/__mocks__/index';
import { getClient } from '../../client/oidc-react';
import { mockMutatorGetterOidc } from '../../client/__mocks__/oidc-react-mock';
import {
  setUpUser,
  clearApiTokens,
  mockApiTokenResponse,
  setEnv,
  logoutUser
} from '../../tests/client.test.helper';
import {
  ApiAccessTokenContext,
  ApiAccessTokenProvider
} from '../../components/ApiAccessTokenProvider';
import {
  ProfileData,
  ProfileActions,
  useProfileWithApiTokens
} from '../profile';
import {
  createValidProfileResponse,
  createInvalidProfileResponse,
  mockProfileResponse
} from '../../tests/profile.test.helper';
import { AnyObject, AnyFunction } from '../../common';
import {
  FetchStatus,
  ApiAccessTokenActions
} from '../../apiAccessTokens/useApiAccessTokens';

describe('Profile.ts useProfileWithApiTokens hook ', () => {
  configureClient({ tokenExchangePath: '/token-exchange/', autoSignIn: true });
  const fetchMock: FetchMock = global.fetch;
  const mockMutator = mockMutatorGetterOidc();
  const client = getClient();
  const testAudience = 'api-audience';
  const profileBackendUrl = 'https://localhost/profileGraphql/';
  let profileActions: ProfileActions;
  let apiTokenActions: ApiAccessTokenActions;
  let dom: ReactWrapper;
  let restoreEnv: AnyFunction;

  const ProfileHookTester = (): React.ReactElement => {
    profileActions = useProfileWithApiTokens();
    return <div id="request-status">{profileActions.getRequestStatus()}</div>;
  };

  const ApiTokenHookTester = (): React.ReactElement => {
    apiTokenActions = useContext(
      ApiAccessTokenContext
    ) as ApiAccessTokenActions;
    return <div id="api-token-status">{apiTokenActions.getStatus()}</div>;
  };

  const TestWrapper = (): React.ReactElement => (
    <ApiAccessTokenProvider>
      <ApiTokenHookTester />
      <ProfileHookTester />
    </ApiAccessTokenProvider>
  );

  type ErrorCatcherProps = React.PropsWithChildren<{
    callback: (err: Error) => void;
  }>;
  class ErrorCatcher extends React.Component<
    ErrorCatcherProps,
    { error?: Error }
  > {
    constructor(props: ErrorCatcherProps) {
      super(props);
      this.state = { error: undefined };
    }

    componentDidCatch(error: Error): void {
      // eslint-disable-next-line no-console
      console.log(`Note: following error is expected: ${error.message}`);
      this.setState({ error });
      this.props.callback(error);
    }

    render(): React.ReactElement {
      return (
        <div>
          {this.state.error ? (
            <div id="bound-error">{this.state.error.message}</div>
          ) : (
            this.props.children
          )}
        </div>
      );
    }
  }

  const setUser = async (user: AnyObject): Promise<void> =>
    setUpUser(user, mockMutator, client);

  const setUpTest = async ({
    response,
    returnApiTokenError
  }: {
    response: AnyObject;
    audience?: string;
    returnApiTokenError?: boolean;
    returnError?: boolean;
  }): Promise<void> => {
    mockApiTokenResponse({
      returnError: returnApiTokenError
    });

    mockProfileResponse({
      response,
      profileBackendUrl
    });

    dom = mount(<TestWrapper />);
  };

  beforeAll(async () => {
    restoreEnv = setEnv({
      REACT_APP_PROFILE_AUDIENCE: testAudience,
      REACT_APP_PROFILE_BACKEND_URL: profileBackendUrl
    });
    fetchMock.enableMocks();
    await client.init();
  });

  afterAll(() => {
    restoreEnv();
    fetchMock.disableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
    mockMutator.resetMock();
  });

  beforeEach(() => {
    if (dom && dom.length) {
      dom.unmount();
    }
    logoutUser(client);
    clearApiTokens(client);
  });

  const getProfileStatus = (): FetchStatus | undefined => {
    dom.update();
    const el = dom.find('#request-status').at(0);
    return el && el.length ? (el.text() as FetchStatus) : undefined;
  };

  const getApiAccessTokenStatus = (): FetchStatus | undefined => {
    dom.update();
    const el = dom.find('#api-token-status').at(0);
    return el && el.length ? (el.text() as FetchStatus) : undefined;
  };

  const getErrorMessage = (): string | undefined => {
    dom.update();
    const el = dom.find('#bound-error').at(0);
    return el && el.length ? el.text() : undefined;
  };

  it('depends on apiAccessToken hook and changes with it', async () => {
    await act(async () => {
      await setUpTest({
        response: createValidProfileResponse()
      });
      await waitFor(() =>
        expect(getApiAccessTokenStatus()).toBe('unauthorized')
      );
      await setUser({});
      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loading'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      expect((profileActions.getData() as ProfileData).firstName).toEqual(
        'firstName'
      );
    });
  });

  it('provides a "fetch"-action that requests data', async () => {
    await act(async () => {
      await setUpTest({
        response: createValidProfileResponse()
      });
      await setUser({});
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      mockProfileResponse({
        response: createInvalidProfileResponse(),
        profileBackendUrl
      });
      profileActions.request({});
      await waitFor(() => expect(getProfileStatus()).toBe('error'));
      mockProfileResponse({
        response: createValidProfileResponse(),
        profileBackendUrl
      });
      profileActions.request({});
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
    });
  });

  it('provides a "clear"-action that clears stored profile data and sets status back to "ready"', async () => {
    await act(async () => {
      await setUser({});
      await setUpTest({
        response: createValidProfileResponse()
      });

      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      expect(profileActions.getData()).toBeDefined();
      profileActions.clear();
      expect(profileActions.getData()).toBeUndefined();
      expect(profileActions.getStatus()).toBe('ready');
    });
  });

  it('profile data is cleared, when user logs out and status is set to "error", because user is unauthorized', async () => {
    await act(async () => {
      await setUser({});
      await setUpTest({
        response: createValidProfileResponse()
      });

      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      logoutUser(client);
      await waitFor(() => expect(getProfileStatus()).toBe('error'));
      expect(profileActions.getData()).toBeUndefined();
    });
  });

  it('throws an error when rendered without apiToken context', async () => {
    let errorCatched: Error | undefined;
    // notify console viewer that error is ok
    // eslint-disable-next-line no-console
    console.log('Note: Error will be thrown...');
    dom = mount(
      <ErrorCatcher
        callback={(err: Error): void => {
          errorCatched = err;
        }}>
        <ProfileHookTester />
      </ErrorCatcher>
    );
    expect(errorCatched).toBeDefined();
    expect(getErrorMessage()).toBeDefined();
  });
});
