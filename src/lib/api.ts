const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080/api';

const INTERNAL_API_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY ?? '';

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  profileId?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (profileId) {
    headers['X-Profile-Id'] = profileId;
    headers['X-Api-Key'] = INTERNAL_API_KEY;
  }

  return fetch(`${BACKEND_BASE_URL}${path}`, { ...options, headers });
}
