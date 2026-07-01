const TOKEN_KEY = "accessToken";

export async function getAccessToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return (result[TOKEN_KEY] as string | undefined) ?? null;
}

export async function setAccessToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearAccessToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}
