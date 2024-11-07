import {toastWarn} from "./toasts"

const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  options.credentials = options.credentials || 'same-origin';

  const response = await originalFetch(url, options);

  if (response.status === 401) {
    toastWarn("Session Expired. Redirecting...")
    window.location.href = '/login';
    return;
  }

  if (response.ok) {
    return response;
  }

  throw new Error(`Request failed with status ${response.status}`);
};
