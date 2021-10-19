import { FetchMock } from 'jest-fetch-mock';

export const getFetchMockLastCall = (
  fetchMock: FetchMock
): [string | Request | undefined, RequestInit | undefined] => {
  const mockCalls = fetchMock.mock.calls;
  return mockCalls[mockCalls.length - 1];
};

export const getFetchMockLastCallAuthenticationHeader = (
  fetchMock: FetchMock
): string | null => {
  const lastCall = getFetchMockLastCall(fetchMock);
  const lastCallHeaders = (lastCall[1] as RequestInit).headers as Headers;
  return lastCallHeaders.get('Authorization');
};
