import { FetchMock } from 'jest-fetch-mock';
import {
  convertQueryToData,
  getProfileApiToken,
  getProfileData,
  getProfileGqlClient,
  ProfileData,
  ProfileQueryResult
} from '../profile';
import { getClient } from '../../clients/oidc-react';
import { mockMutatorGetterOidc } from '../../clients/__mocks__/oidc-react-mock';
import {
  setUpUser,
  clearApiTokens,
  logoutUser,
  setEnv
} from '../../clients/__tests__/common';
import {
  createInvalidProfileResponse,
  createValidProfileResponse,
  createValidProfileResponseData,
  mockProfileResponse
} from './common';
import { configureClient } from '../../clients/__mocks__';
import { FetchError } from '../../clients';
import { AnyObject, AnyFunction } from '../../common';

describe('Profile.ts', () => {
  configureClient();
  const fetchMock: FetchMock = global.fetch;
  const mockMutator = mockMutatorGetterOidc();
  const client = getClient();
  let restoreEnv: AnyFunction;
  const testAudience = 'api-audience';
  const profileBackendUrl = 'https://localhost/profileGraphql/';
  let lastRequest: Request;

  const setUser = async (user: AnyObject): Promise<void> =>
    setUpUser(user, mockMutator, client);

  const setValidApiToken = (): string => {
    const value = 'valid-api-token';
    const addedToken = { [testAudience]: value };
    client.addApiTokens(addedToken);
    return value;
  };

  const isApiTokenInRequest = (req: Request): boolean => {
    const { headers } = req;
    const authHeader = headers.get('Authorization');
    const profileToken = getProfileApiToken();
    return !!(authHeader && authHeader.includes(`Bearer ${profileToken}`));
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
    logoutUser(client);
    clearApiTokens(client);
  });

  it('getProfileApiToken() returns api token or undefined if api token is not set', async () => {
    await setUser({});
    const token = getProfileApiToken();
    expect(token).toBeUndefined();
    const tokenValue = setValidApiToken();
    expect(getProfileApiToken()).toEqual(tokenValue);
  });

  it('convertQueryToData() extracts actual profile data from graphql response or return undefined', async () => {
    const email = 'email@dom.com';
    const emailDataTree = { emails: { edges: [{ node: { email } }] } };
    const response = createValidProfileResponseData(emailDataTree);
    const data = convertQueryToData(response as ProfileQueryResult);
    expect(data && data.email).toBe(email);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('firstName');
    expect(
      convertQueryToData((emailDataTree as unknown) as ProfileQueryResult)
    ).toBeUndefined();
  });

  it('getProfileGqlClient() returns client or undefined if api token is not set', () => {
    const undefinedBeforeApiTokenIsSet = getProfileGqlClient();
    expect(undefinedBeforeApiTokenIsSet).toBeUndefined();
    setValidApiToken();
    const gqlclient = getProfileGqlClient();
    expect(gqlclient).toBeDefined();
  });

  it('getProfileData() returns FetchError or ProfileData', async () => {
    const errorBecauseApiTokenNotSet: FetchError = await getProfileData();
    expect(errorBecauseApiTokenNotSet.error).toBeDefined();
    setValidApiToken();
    mockProfileResponse({
      response: createInvalidProfileResponse(),
      profileBackendUrl
    });
    const serverErrorResponse: FetchError = await getProfileData();
    expect(serverErrorResponse.error).toBeDefined();
    // must reset before new call to same url
    fetchMock.resetMocks();
    mockProfileResponse({
      requestCallback: (req: unknown): void => {
        lastRequest = req as Request;
      },
      response: createValidProfileResponse(),
      profileBackendUrl
    });
    const data: ProfileData = (await getProfileData()) as ProfileData;
    expect(data.firstName as ProfileData).toBe('firstName');
    expect(isApiTokenInRequest(lastRequest)).toBe(true);
  });
});
