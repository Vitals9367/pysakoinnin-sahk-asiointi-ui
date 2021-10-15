import React, { useContext } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/react';
import { FetchMock } from 'jest-fetch-mock';
import { configureClient } from '../../client/__mocks__/index';
import { useClient } from '../../client/hooks';
import { getClient } from '../../client/oidc-react';
import { mockMutatorGetterOidc } from '../../client/__mocks__/oidc-react-mock';
import {
  setUpUser,
  clearApiTokens,
  mockApiTokenResponse,
  createApiTokenFetchPayload,
  logoutUser,
  setEnv
} from '../../client/__tests__/common';
import {
  ApiAccessTokenContext,
  ApiAccessTokenProvider
} from '../../components/ApiAccessTokenProvider';
import { ProfileData, useProfile, ProfileActions } from '../profile';
import {
  createValidProfileResponse,
  createInvalidProfileResponse,
  mockProfileResponse
} from './common';
import { AnyObject, AnyFunction } from '../../common';
import {
  FetchStatus,
  ApiAccessTokenActions
} from '../../apiAccessTokens/useApiAccessTokens';

describe('Profile.ts useProfile hook ', () => {
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
    profileActions = useProfile();
    return <div id="profile-status">{profileActions.getStatus()}</div>;
  };

  const ApiTokenHookTester = (): React.ReactElement => {
    apiTokenActions = useContext(
      ApiAccessTokenContext
    ) as ApiAccessTokenActions;
    return <div id="api-token-status">{apiTokenActions.getStatus()}</div>;
  };

  const TestWrapper = (): React.ReactElement => {
    const userClient = useClient();
    return (
      <ApiAccessTokenProvider>
        <ApiTokenHookTester />
        {userClient.isAuthenticated() && <ProfileHookTester />}
      </ApiAccessTokenProvider>
    );
  };

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
    mockApiTokenResponse({ returnError: returnApiTokenError });

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
    clearApiTokens(client);
  });

  const getProfileStatus = (): FetchStatus | undefined => {
    dom.update();
    const el = dom.find('#profile-status').at(0);
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
        expect(apiTokenActions.getStatus()).toBe('unauthorized')
      );
      await setUser({});
      await waitFor(() => expect(apiTokenActions.getStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loading'));
      expect(profileActions.getProfile()).toBeUndefined();
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      expect((profileActions.getProfile() as ProfileData).firstName).toEqual(
        'firstName'
      );
    });
  });

  it('provides actions that are callable', async () => {
    await act(async () => {
      const validProfileResponseSettings = {
        response: createValidProfileResponse(),
        profileBackendUrl
      };
      mockApiTokenResponse();
      mockProfileResponse(validProfileResponseSettings);
      await setUser({});
      await setUpTest({
        response: createInvalidProfileResponse()
      });
      await waitFor(() => expect(apiTokenActions.getStatus()).toBe('loaded'));
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
      // must reset before new call to same url
      fetchMock.resetMocks();
      mockProfileResponse({
        ...validProfileResponseSettings,
        requestCallback: () => {
          expect(profileActions.getStatus()).toBe('loading');
        }
      });
      await profileActions.fetch();
      expect(profileActions.getStatus()).toBe('loaded');
      expect(profileActions.getProfile()).toBeDefined();
      // await profileActions.clear();
      expect(profileActions.getProfile()).toBeUndefined();
      expect(profileActions.getStatus()).toBe('ready');
    });
  });

  it('profile can be manually fetched after initial status was error', async () => {
    await act(async () => {
      await setUpTest({
        response: createInvalidProfileResponse()
      });
      mockApiTokenResponse({ returnError: true });

      apiTokenActions.fetch(createApiTokenFetchPayload());
      await waitFor(() => expect(apiTokenActions.getStatus()).toBe('error'));
      await waitFor(() => expect(getApiAccessTokenStatus()).toBe('error'));
      await waitFor(() => expect(getProfileStatus()).toBe('error'));
      mockApiTokenResponse();
      mockProfileResponse({
        response: createValidProfileResponse(),
        profileBackendUrl
      });
      apiTokenActions.fetch(createApiTokenFetchPayload());
      await waitFor(() => expect(apiTokenActions.getStatus()).toBe('loaded'));
      profileActions.fetch();
      await waitFor(() => expect(getProfileStatus()).toBe('loaded'));
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

  it('throws an error when rendered without authorization', async () => {
    let errorCatched: Error | undefined;
    logoutUser(client);
    // eslint-disable-next-line no-console
    console.log('Note: Error will be thrown...');
    dom = mount(
      <ErrorCatcher
        callback={(err: Error): void => {
          errorCatched = err;
        }}>
        <ApiAccessTokenProvider>
          <ProfileHookTester />
        </ApiAccessTokenProvider>
      </ErrorCatcher>
    );
    expect(errorCatched).toBeDefined();
    expect(getErrorMessage()).toBeDefined();
  });
});
