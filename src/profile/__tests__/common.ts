import { FetchMock } from 'jest-fetch-mock';
import { ProfileData } from '../profile';

export const createValidProfileResponseData = (
  userData: Record<string, {}>
): ProfileData => {
  return { data: { myProfile: { ...userData } } };
};

export const mockProfileResponse = (options: {
  response: Record<string, {}>;
  profileBackendUrl: string;
  delay?: number;
  requestCallback?: Function;
}): void => {
  const fetchMock: FetchMock = global.fetch;
  const { response, delay, requestCallback, profileBackendUrl } = options;
  fetchMock.doMockOnceIf(profileBackendUrl, req => {
    if (requestCallback) {
      requestCallback(req);
    }
    return new Promise(resolve =>
      setTimeout(() => {
        resolve(response);
      }, delay || 20)
    );
  });
};

export const createValidProfileResponse = (
  overrides?: ProfileData
): { status: number; body: string } => {
  const responseBody = createValidProfileResponseData({
    firstName: 'firstName',
    ...overrides
  });
  return {
    status: 200,
    body: JSON.stringify(responseBody)
  };
};

export const createInvalidProfileResponse = (
  overrides?: ProfileData
): { status: number; body: string } => {
  const responseBody = {
    ...overrides
  };
  return {
    status: 401,
    body: JSON.stringify(responseBody)
  };
};

describe('createValidProfileResponse', () => {
  it('returns an object', () => {
    expect(createInvalidProfileResponse()).toBeDefined();
  });
});
