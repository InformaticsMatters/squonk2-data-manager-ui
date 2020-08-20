import { KeycloakTokens } from '@react-keycloak/web';

enum LocalStorageKeys {
  KcTokens = 'kcTokens',
  CookieConsent = 'cookieConsent',
}

class LocalStorageService {
  private _writeData<T>(key: LocalStorageKeys, data: T) {
    try {
      const serialisedSlice = JSON.stringify(data);
      localStorage.setItem(key, serialisedSlice);
    } catch (err) {
      console.error(err);
    }
  }

  private _getData<T>(key: LocalStorageKeys): T | undefined {
    try {
      const serialisedSlice = localStorage.getItem(key);
      if (serialisedSlice === null) {
        return undefined;
      }
      return JSON.parse(serialisedSlice);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  private _getAllData() {
    return Object.fromEntries(
      Object.entries(localStorage).map((pair) => {
        try {
          return [pair[0], JSON.parse(pair[1])];
        } catch {
          return [pair[0], undefined];
        }
      }),
    );
  }

  private _removeData(key: LocalStorageKeys) {
    localStorage.removeItem(key);
  }

  // Cookie Consent Storage
  cookiesConsented() {
    this._writeData(LocalStorageKeys.CookieConsent, 'true');
  }

  getHasConsented() {
    const hasConsented = this._getData<string>(LocalStorageKeys.CookieConsent);
    if (hasConsented !== undefined) {
      return true;
    } else {
      return false;
    }
  }

  // Keycloak related storage functions
  saveKeycloakTokens(tokens: KeycloakTokens) {
    this._writeData<typeof tokens>(LocalStorageKeys.KcTokens, tokens);
  }

  getKeycloakTokens() {
    return this._getData<KeycloakTokens>(LocalStorageKeys.KcTokens);
  }

  removeKeycloakTokens() {
    this._removeData(LocalStorageKeys.KcTokens);
  }
}

export default new LocalStorageService();
