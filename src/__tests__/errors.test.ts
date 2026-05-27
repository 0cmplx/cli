import { describe, it, expect } from 'vitest';
import { ApiError, ContextError, AuthError, ValidationError, ERRORS } from '../domain/errors.js';

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

describe('AuthError', () => {
  it('sets message', () => {
    const err = new AuthError('Bad token');
    expect(err.message).toBe('Bad token');
    expect(err.name).toBe('AuthError');
  });

  it('is an instance of Error', () => {
    const err = new AuthError('Expired');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AuthError);
  });
});

describe('ValidationError', () => {
  it('sets message', () => {
    const err = new ValidationError('Invalid ID');
    expect(err.message).toBe('Invalid ID');
    expect(err.name).toBe('ValidationError');
  });

  it('is an instance of Error', () => {
    const err = new ValidationError('Bad input');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ValidationError);
  });
});

describe('ERRORS', () => {
  it('contains expected error messages', () => {
    expect(ERRORS.NOT_AUTHENTICATED).toContain('Not authenticated');
    expect(ERRORS.INVALID_TOKEN).toBe('Invalid token.');
    expect(ERRORS.INVALID_TOKEN_FORMAT).toContain('0cx_');
    expect(ERRORS.NO_TOKEN_PROVIDED).toBe('No token provided.');
    expect(ERRORS.NO_APP_CONTEXT).toContain('No app selected');
    expect(ERRORS.NO_SCHEMA_CONTEXT).toContain('No schema selected');
  });
});
