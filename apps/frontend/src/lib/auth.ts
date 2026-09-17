const TOKEN_KEY = "subahbd_token";

const isBrowser = () => typeof window !== "undefined";

export function getAccessToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
}
