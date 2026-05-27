import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '../domain/errors.js';

// Mock credentials before importing api module
vi.mock('../infrastructure/credentials.js', () => ({
  getToken: vi.fn(() => 'test_token'),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('request', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('throws ApiError on 401', async () => {
    const { request } = await import('../infrastructure/api.js');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => '',
    });

    try {
      await request('/api/test');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
    }
  });

  it('throws ApiError with server error message', async () => {
    const { request } = await import('../infrastructure/api.js');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'Internal failure' }),
    });

    await expect(request('/api/test')).rejects.toThrow('Internal failure');
  });

  it('returns parsed JSON on success', async () => {
    const { request } = await import('../infrastructure/api.js');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'value' }),
    });

    const result = await request('/api/test');
    expect(result).toEqual({ data: 'value' });
  });

  it('returns undefined for 204 No Content', async () => {
    const { request } = await import('../infrastructure/api.js');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await request('/api/test');
    expect(result).toBeUndefined();
  });

  it('sends Authorization header', async () => {
    const { request } = await import('../infrastructure/api.js');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await request('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test_token',
        }),
      }),
    );
  });

  it('sends JSON body when provided', async () => {
    const { request } = await import('../infrastructure/api.js');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await request('/api/test', { method: 'POST', body: { key: 'value' } });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});
