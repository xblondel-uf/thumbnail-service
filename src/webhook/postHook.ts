import fetch from 'node-fetch';

/**
 * Data that is sent to the webhook.
 */
export interface HookData {
  url: string;
  ok: boolean;
  statusText: string;
}

/**
 * Calls the webhook if any.
 *
 * @param hookUrl - Hook url to call, maybe null
 * @param pdfUrl - PDF url to notify
 * @param ok - True if the operation succeeded, else false
 * @param statusText - Additional status information (most notably the error message if any)
 * @returns Nothing
 */
export async function postHook(
  hookUrl: string | null,
  pdfUrl: string,
  ok: boolean,
  statusText: string = ''
): Promise<void> {
  if (!hookUrl) {
    return;
  }

  const hookData: HookData = {
    url: pdfUrl,
    ok,
    statusText,
  };

  const response = await fetch(hookUrl, {
    method: 'post',
    body: JSON.stringify(hookData),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    console.error(
      `Calling hook [${hookUrl}] failed with error ${response.statusText}`
    );
    return;
  }
  await response.json();
}
