/**
 * Fetch wrapper with a bounded timeout, external AbortSignal support,
 * and consistent HTTP error handling.
 *
 * - If the caller aborts, the caller's AbortError is preserved.
 * - If the timeout expires, a TimeoutError is thrown.
 * - Non-2xx responses throw an HttpError carrying status/statusText.
 */
export async function fetchWithTimeout(input, options = {}) {
  const {
    timeoutMs = 12000,
    signal: externalSignal,
    throwOnHttpError = true,
    ...fetchOptions
  } = options;

  if (externalSignal?.aborted) {
    if (externalSignal.reason instanceof Error) throw externalSignal.reason;
    const abortError = new Error('The request was aborted');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const controller = new AbortController();
  let timedOut = false;

  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs)
    : null;

  try {
    const response = await fetch(input, { ...fetchOptions, signal: controller.signal });
    if (throwOnHttpError && !response.ok) {
      const error = new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`);
      error.name = 'HttpError';
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }
    return response;
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
    externalSignal?.removeEventListener?.('abort', abortFromExternal);
  }
}

export function isAbortError(error) {
  return error?.name === 'AbortError';
}

export function isTimeoutError(error) {
  return error?.name === 'TimeoutError';
}
