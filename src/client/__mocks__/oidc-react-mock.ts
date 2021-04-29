import {
  UserManager,
  UserManagerSettings,
  User,
  UserManagerEvents
} from 'oidc-client';
import { mockMutatorCreator, MockMutator } from './index';
import { AnyFunction } from '../../common';

let oidcReactMutator: MockMutator;

// imports in setUpTests.ts require "mock" prefix, therefore getMockMutator would be invalid
export const mockMutatorGetterOidc = (): MockMutator => {
  if (!oidcReactMutator) {
    oidcReactMutator = mockMutatorCreator();
  }
  return oidcReactMutator;
};

const mockUserManagerEvents = (): UserManagerEvents => {
  const listeners: Map<
    string,
    (
      | UserManagerEvents.UserLoadedCallback
      | UserManagerEvents.SilentRenewErrorCallback
    )[]
  > = new Map();
  const addListener = (
    type: string,
    callback:
      | UserManagerEvents.UserLoadedCallback
      | UserManagerEvents.SilentRenewErrorCallback
  ): void => {
    if (!listeners.has(type)) {
      listeners.set(type, []);
    }
    const list = listeners.get(type);
    if (list) {
      list.push(callback);
    }
  };
  const trigger = (type: string, payload: User & Error): void => {
    if (!listeners.has(type)) {
      return;
    }
    const list = listeners.get(type);
    if (list) {
      list.forEach(callback => callback(payload));
    }
  };
  return {
    load: (): boolean => true,
    unload: (): boolean => true,
    addUserUnloaded: (callback: UserManagerEvents.UserLoadedCallback): void => {
      addListener('userUnloaded', callback);
    },
    addUserSignedOut: (
      callback: UserManagerEvents.UserLoadedCallback
    ): void => {
      addListener('userSignedOut', callback);
    },
    addUserSessionChanged: (
      callback: UserManagerEvents.UserLoadedCallback
    ): void => {
      addListener('userSessionChanged', callback);
    },
    addSilentRenewError: (
      callback: UserManagerEvents.SilentRenewErrorCallback
    ): void => {
      addListener('silentRenewError', callback);
    },
    addAccessTokenExpired: (
      callback: UserManagerEvents.UserLoadedCallback
    ): void => {
      addListener('accessTokenExpired', callback);
    },
    addUserLoaded: (callback: UserManagerEvents.UserLoadedCallback): void => {
      addListener('userLoaded', callback);
    },
    addAccessTokenExpiring: (
      callback: UserManagerEvents.UserLoadedCallback
    ): void => {
      addListener('accessTokenExpiring', callback);
    },
    removeUserLoaded: (): unknown => true,
    removeUserUnloaded: (): unknown => true,
    removeSilentRenewError: (): unknown => true,
    removeUserSignedOut: (): unknown => true,
    removeAccessTokenExpired: (): unknown => true,
    removeAccessTokenExpiring: (): unknown => true,
    removeUserSessionChanged: (): unknown => true,
    addUserSignedIn: (): unknown => true,
    removeUserSignedIn: (): unknown => true,
    trigger
  } as UserManagerEvents;
};

export const mockOidcUserManager = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: UserManagerSettings
): Partial<UserManager> => {
  const mockMutator = mockMutatorGetterOidc();
  mockMutator.clientCreated();
  const initPromiseF = (): Promise<User> => {
    mockMutator.initCalled();
    const clientInitRejectPayload = mockMutator.getClientInitRejectPayload();
    return new Promise(
      (
        resolve: (props?: unknown) => unknown,
        reject: (props?: unknown) => unknown
      ) => {
        setTimeout((): void => {
          const tokenParsed = mockMutator.getTokenParsed();
          const sessionState = tokenParsed.session_state;
          const user = sessionState
            ? {
                profile: mockMutator.getTokenParsed(),
                session_state: sessionState,
                expired: false
              }
            : undefined;
          // eslint-disable-next-line no-unused-expressions
          clientInitRejectPayload
            ? reject(clientInitRejectPayload)
            : resolve(user);
        }, mockMutator.promiseTimeout);
      }
    ) as Promise<User>;
  };
  return {
    signinSilent(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initOptions?: UserManagerSettings
    ): Promise<User> {
      return initPromiseF();
    },
    signinRedirect: (args?: unknown): Promise<void> => {
      mockMutator.loginCalled(args);
      return Promise.resolve();
    },
    signoutRedirect: (args?: unknown): Promise<void> => {
      mockMutator.logoutCalled(args);
      mockMutator.setUser();
      return Promise.resolve();
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signinRedirectCallback: (url?: string): Promise<User> => initPromiseF(),
    getUser: (): Promise<User> => {
      const loadProfileRejectPayload = mockMutator.getLoadProfileRejectPayload();
      const loadProfileResolvePayload = mockMutator.getLoadProfileResolvePayload();
      return new Promise((resolve: AnyFunction, reject: AnyFunction) => {
        setTimeout((): void => {
          // eslint-disable-next-line no-unused-expressions
          loadProfileRejectPayload
            ? reject(loadProfileRejectPayload)
            : resolve({ ...loadProfileResolvePayload, expired: false });
        }, mockMutator.promiseTimeout);
      }) as Promise<User>;
    },
    events: mockUserManagerEvents()
  };
};
