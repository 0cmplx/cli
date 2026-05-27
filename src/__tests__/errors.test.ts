import { describe, it, expect } from 'vitest';
import { ApiError, ContextError } from '../domain/errors.js';

describe('ApiError', () => {
  it('sets status and code', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('Not found');
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('ApiError');
  });

  it('is an instance of Error', () => {
    const err = new ApiError(500, 'Server error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });

  it('preserves stack trace', () => {
    const err = new ApiError(401, 'Unauthorised');
    expect(err.stack).toBeDefined();
  });
});

describe('ContextError', () => {
  it('sets message', () => {
    const err = new ContextError('No context');
    expect(err.message).toBe('No context');
    expect(err.name).toBe('ContextError');
  });

  it('is an instance of Error', () => {
    const err = new ContextError('Missing');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ContextError);
  });
});
