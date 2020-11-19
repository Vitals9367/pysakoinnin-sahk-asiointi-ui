import { FetchMock } from 'jest-fetch-mock';
import mockedEnv, { RestoreFn } from 'mocked-env';
import { Client, FetchApiTokenOptions, getClientConfig, getTokenUri } from '..';
import { MockMutator } from '../__mocks__';

export const mockApiTokenResponse = (
  options: {
    audience?: string;
    uri?: string;
    delay?: number;
    requestCallback?: Function;
    returnError?: boolean;
  } = {}
): {} => {
  const { audience, uri, delay, requestCallback, returnError } = options;
  const fetchMock: FetchMock = global.fetch;
  const tokenKey =
    audience || process.env.REACT_APP_PROFILE_AUDIENCE || 'unknown';
  const tokens = { [tokenKey]: 'apiToken' };
  const responseData = returnError
    ? { status: 401, body: JSON.stringify({ error: true }) }
    : {
        status: 200,
        body: JSON.stringify(tokens)
      };
  const endPointUri =
    uri ||
    getTokenUri({
      ...getClientConfig()
    });
  fetchMock.doMockOnceIf(endPointUri, req => {
    if (requestCallback) {
      requestCallback(req);
    }
    return new Promise(resolve =>
      setTimeout(() => {
        resolve(responseData);
      }, delay || 20)
    );
  });
  return tokens;
};

export const clearApiTokens = (client: Client): void => {
  const apiTokens = client.getApiTokens();
  if (apiTokens) {
    Object.keys(apiTokens).forEach(key => {
      client.removeApiToken(key);
    });
  }
};

export const logoutUser = (client: Client): void => {
  if (client.isAuthenticated()) {
    client.onAuthChange(false);
  }
};

export const setUpUser = async (
  user: {},
  mockMutator: MockMutator,
  client: Client
): Promise<void> => {
  mockMutator.setLoadProfilePayload(
    mockMutator.createValidUserData(user),
    undefined
  );
  await client.loadUserProfile();
  client.onAuthChange(true);
};

export const createApiTokenFetchPayload = (
  overrides?: FetchApiTokenOptions
): FetchApiTokenOptions => {
  return {
    audience: 'audience',
    grantType: 'grantType',
    permission: 'permission',
    ...overrides
  };
};

export const setEnv = (overrides: Partial<NodeJS.ProcessEnv>): RestoreFn => {
  return mockedEnv(overrides, { restore: true });
};

describe('createApiTokenFetchPayload', () => {
  it('returns an object', () => {
    expect(createApiTokenFetchPayload()).toBeDefined();
  });
});
