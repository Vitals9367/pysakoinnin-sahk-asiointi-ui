import to from 'await-to-js';
import { GraphQLError } from 'graphql';
import { loader } from 'graphql.macro';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ApolloError } from '@apollo/client';
import { FetchStatus } from '../client/hooks';
import { getClient } from '../client/oidc-react';
import {
  GraphQLClient,
  createGraphQLClient,
  GraphQLClientError,
  resetClient
} from '../graphql/graphqlClient';
import { ApiAccessTokenContext } from '../components/ApiAccessTokenProvider';
import { AnyObject } from '../common';

let profileGqlClient: GraphQLClient;

export type ProfileDataType = string | AnyObject | undefined;
export type ProfileErrorType = Error | GraphQLClientError | string | undefined;
export type ProfileData = Record<string, ProfileDataType>;
export type ProfileQueryResult = {
  data: {
    myProfile: GraphQLProfile;
  };
  errors?: readonly GraphQLError[];
};
export type GraphQLProfile =
  | Record<string, { edges: { node: { email: string } }[] }>
  | undefined;
export type ProfileActions = {
  getProfile: () => ProfileData | GraphQLClientError;
  fetch: () => Promise<ProfileData | GraphQLClientError>;
  getStatus: () => FetchStatus;
  clear: () => Promise<void>;
  getErrorMessage: () => string | undefined;
  getResultErrorMessage: () => string | undefined;
};

export function getProfileApiToken(): string | undefined {
  const client = getClient();
  const tokenKey = process.env.REACT_APP_PROFILE_AUDIENCE;
  if (!tokenKey) {
    return undefined;
  }
  const apiTokens = client.getApiTokens();
  return apiTokens[tokenKey];
}

export function getProfileGqlClient(): GraphQLClient | undefined {
  if (!profileGqlClient) {
    const token = getProfileApiToken();
    const uri = process.env.REACT_APP_PROFILE_BACKEND_URL;
    if (!token || !uri) {
      return undefined;
    }
    profileGqlClient = createGraphQLClient(uri, token);
  }
  return profileGqlClient;
}

export function convertQueryToData(
  queryResult: ProfileQueryResult
): ProfileData | undefined {
  const profile = queryResult && queryResult.data && queryResult.data.myProfile;
  if (!profile) {
    return undefined;
  }
  const { id, firstName, lastName, nickname, language } = profile;
  const getEmail = (data: GraphQLProfile): string | undefined => {
    const list = data?.emails?.edges;
    return list && list[0] && list[0].node?.email;
  };
  return {
    id,
    firstName,
    lastName,
    nickname,
    language,
    email: getEmail(profile)
  };
}

function getResultGraphQLErrorMessage(
  result: ProfileQueryResult
): string | undefined {
  const errorData = result.errors && result.errors[0];
  if (errorData && errorData.message) {
    return `${errorData.message} ${errorData.extensions?.code}`;
  }
  return undefined;
}

export async function getProfileData(): Promise<
  ProfileQueryResult | GraphQLClientError
> {
  const client = getProfileGqlClient();
  if (!client) {
    return Promise.resolve({
      error: new Error(
        'getProfileGqlClient returned undefined. Missing ApiToken for env.REACT_APP_PROFILE_AUDIENCE or missing env.REACT_APP_PROFILE_BACKEND_URL '
      )
    });
  }
  const MY_PROFILE_QUERY = loader('../graphql/MyProfileQuery.graphql');
  const [error, result]: [
    Error | ApolloError | null,
    ProfileQueryResult | undefined
  ] = await to(
    client.query({
      errorPolicy: 'all',
      query: MY_PROFILE_QUERY
    })
  );
  if (error || !result) {
    return {
      error: error || undefined,
      message: 'Query error'
    };
  }
  const data = convertQueryToData(result);
  if (!data) {
    return {
      error: result.errors
        ? result.errors[0]
        : new Error('Query result is missing data.myProfile')
    };
  }
  return result;
}

export function useProfile(): ProfileActions {
  const actions = useContext(ApiAccessTokenContext);
  if (!actions) {
    throw new Error(
      'ApiAccessTokenActions not provided from ApiAccessTokenContext. Provide context in React Components with ApiAccessTokenProvider.'
    );
  }
  const { getStatus } = actions;
  const [profileData, setProfileData] = useState<ProfileData | undefined>();
  const [error, setError] = useState<ProfileErrorType>();
  const [resultErrorMessage, setResultErrorMessage] = useState<
    ProfileErrorType
  >();
  const apiAccessTokenStatus = getStatus();

  const resolveStatus = (): FetchStatus => {
    if (apiAccessTokenStatus === 'loaded') {
      return 'ready';
    }
    if (
      apiAccessTokenStatus === 'error' ||
      apiAccessTokenStatus === 'unauthorized'
    ) {
      return apiAccessTokenStatus;
    }
    return 'waiting';
  };

  const resolveCurrentStatus = (
    baseStatus: FetchStatus,
    stateStatus: FetchStatus
  ): FetchStatus => {
    if (stateStatus === 'loading' || stateStatus === 'loaded') {
      return stateStatus;
    }
    if (profileData) {
      return 'loaded';
    }
    if (stateStatus === 'waiting') {
      return baseStatus;
    }
    if (baseStatus === 'unauthorized') {
      return 'unauthorized';
    }
    return stateStatus;
  };

  const resolvedStatus = resolveStatus();
  const [status, setStatus] = useState<FetchStatus>(resolvedStatus);
  if (status === 'unauthorized') {
    throw new Error(
      'useProfile hook should not be rendered if client is not authorized.'
    );
  }
  const currentStatus = resolveCurrentStatus(resolvedStatus, status);

  const fetchProfile: ProfileActions['fetch'] = useCallback(async () => {
    setStatus('loading');
    const result = await getProfileData();
    if ((result as GraphQLClientError).error) {
      setError((result as GraphQLClientError).error);
      setProfileData(undefined);
      setResultErrorMessage(undefined);
      setStatus('error');
    } else {
      setError(undefined);
      setResultErrorMessage(
        getResultGraphQLErrorMessage(result as ProfileQueryResult)
      );
      setProfileData(
        (result as ProfileQueryResult).data.myProfile as ProfileData
      );
      setStatus('loaded');
    }
    return (result as ProfileQueryResult).data;
  }, []);

  useEffect(() => {
    const autoFetch = async (): Promise<void> => {
      if (currentStatus !== 'ready') {
        return;
      }
      fetchProfile();
    };

    autoFetch();
  }, [fetchProfile, currentStatus]);

  useEffect(() => {
    if (apiAccessTokenStatus === 'error' && status !== apiAccessTokenStatus) {
      setStatus(apiAccessTokenStatus);
    }
  }, [setStatus, apiAccessTokenStatus, status]);

  return {
    getStatus: () => status,
    getProfile: () => profileData,
    getResultErrorMessage: () => resultErrorMessage,
    getErrorMessage: () => {
      if (!error) {
        return undefined;
      }
      if (typeof error === 'string') {
        return error;
      }
      if (error.message) {
        return error.message;
      }
      if ((error as GraphQLClientError).error) {
        return (error as GraphQLClientError).error?.message;
      }
      return undefined;
    },
    fetch: () => fetchProfile(),
    clear: async () => {
      const client = getProfileGqlClient();
      if (client) {
        await resetClient(client);
      }
      setError(undefined);
      setProfileData(undefined);
      setResultErrorMessage(undefined);
      setStatus(resolveStatus());
    }
  } as ProfileActions;
}
