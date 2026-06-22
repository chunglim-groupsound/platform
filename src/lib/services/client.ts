// ─────────────────────────────────────────────────────────────────────────────
// API 클라이언트 (자리만) — 추후 실제 백엔드 연동 시 이 파일만 채우면 된다.
// 지금은 목 데이터를 쓰므로 실제 fetch 는 호출되지 않는다.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
