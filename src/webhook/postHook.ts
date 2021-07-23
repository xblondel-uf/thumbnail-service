import fetch, { Response } from 'node-fetch';

export interface HookData {
  url: string;
  ok: boolean;
  statusText: string;
}

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
  }
}
