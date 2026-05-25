const API_URL = process.env.CMPLX_API_URL || 'https://api.0cmplx.com';

interface VerifyResponse {
  user: {
    id: string;
    login: string;
    tier: string;
  };
  scopes: string[];
}

export async function verifyToken(token: string): Promise<VerifyResponse> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Invalid token' : `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.user) throw new Error('Invalid token');
  return data;
}
