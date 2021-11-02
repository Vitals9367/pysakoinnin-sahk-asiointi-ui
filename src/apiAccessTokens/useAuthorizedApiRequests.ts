import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import to from 'await-to-js';

import { ApiAccessTokenContext } from '../components/ApiAccessTokenProvider';
import { FetchStatus } from './useApiAccessTokens';
import { JWTPayload } from '../client';

export type RequestProps<P> = {
  data?: P;
};

export type AuthorizedRequestProps<P> = {
  data?: P;
  apiTokens: JWTPayload;
};

export type AuthorizedRequest<R, P> = (
  fetchProps: AuthorizedRequestProps<P>
) => Promise<R | undefined>;

export type AuthorizedApiActions<R, P> = {
  getStatus: () => FetchStatus;
  getApiTokenStatus: () => FetchStatus;
  getRequestStatus: () => FetchStatus;
  getApiTokenError: () => string | undefined;
  getRequestError: () => string | undefined;
  request: (props?: RequestProps<P>) => Promise<R | undefined>;
  getData: () => R | undefined;
  getTokens: () => JWTPayload | undefined;
  clear: () => void;
};

export default function useAuthorizedApiRequests<R, P>(
  authorizedRequest: AuthorizedRequest<R, P>,
  autoFetchProps?: RequestProps<P>
): AuthorizedApiActions<R, P> {
  const actions = useContext(ApiAccessTokenContext);
  if (!actions) {
    throw new Error(
      'ApiAccessTokenActions not provided from ApiAccessTokenContext. Provide context in React Components with ApiAccessTokenProvider.'
    );
  }
  const {
    getStatus: getApiAccessTokenStatus,
    getErrorMessage: getApiTokenErrorMessage,
    getTokens
  } = actions;
  const [requestStatus, setRequestStatus] = useState<FetchStatus>('waiting');
  const [result, setResult] = useState<R>();
  const [error, setError] = useState<Error>();
  const autoFetchPropsRef = useRef<RequestProps<P> | undefined>(autoFetchProps);

  const resolveStatus = (
    apiAccessTokenStatus: FetchStatus,
    reqStatus: FetchStatus
  ): FetchStatus => {
    if (apiAccessTokenStatus === 'loaded') {
      return 'ready';
    }
    if (apiAccessTokenStatus === 'error') {
      return 'error';
    }

    if (
      reqStatus === 'loading' ||
      reqStatus === 'loaded' ||
      reqStatus === 'error'
    ) {
      return reqStatus;
    }

    return 'waiting';
  };

  const status = resolveStatus(getApiAccessTokenStatus(), requestStatus);

  if (getApiAccessTokenStatus() === 'unauthorized' && result) {
    setResult(undefined);
    setError(new Error('User is unauthorized'));
    setRequestStatus('error');
  }

  const requestWrapper: AuthorizedApiActions<R, P>['request'] = useCallback(
    async props => {
      setRequestStatus('loading');
      const [err, data] = await to<R | undefined, Error>(
        authorizedRequest({ ...props, apiTokens: getTokens() as JWTPayload })
      );
      if (err) {
        setRequestStatus('error');
        setError(err);
        setResult(undefined);
        return undefined;
      }
      setRequestStatus('loaded');
      setResult(data);
      setError(undefined);
      return data as R;
    },
    [authorizedRequest, getTokens]
  );

  useEffect(() => {
    if (!autoFetchPropsRef.current || status !== 'ready') {
      return;
    }
    const autoFetch = async (): Promise<void> => {
      requestWrapper(autoFetchPropsRef.current as RequestProps<P>);
      autoFetchPropsRef.current = undefined;
    };
    autoFetch();
  }, [requestWrapper, status]);

  return {
    getStatus: () => status,
    getApiTokenStatus: () => getApiAccessTokenStatus(),
    getRequestStatus: () => requestStatus,
    getApiTokenError: () => getApiTokenErrorMessage(),
    getData: () => result,
    getTokens: () => getTokens(),
    getRequestError: () => {
      if (!error) {
        return undefined;
      }
      if (typeof error === 'string') {
        return error;
      }
      if (error.message) {
        return error.message;
      }
      return undefined;
    },
    clear: () => {
      setResult(undefined);
      setError(undefined);
    },
    request: props => {
      if (getApiAccessTokenStatus() !== 'loaded') {
        setError(new Error('Api tokens are not fetched.'));
        return Promise.resolve({} as R);
      }
      return requestWrapper(props);
    }
  };
}
