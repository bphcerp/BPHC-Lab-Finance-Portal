import {toastError, toastWarn} from "./toasts"

const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  options.credentials = options.credentials || 'same-origin';

  const response = await originalFetch(url, options);

  if (response.status === 440) {
    toastWarn("Session Expired. Redirecting...")
    window.location.href = '/login';
    return;
  }

  else if (response.status === 500){
    toastError((await response.json()).message || "Something went wrong")
    console.error((await response.json()).message || "Something went wrong")
    return
  }

  else return response
};
