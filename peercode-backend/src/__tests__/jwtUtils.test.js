'use strict';

process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-at-least-32-chars';

const { signToken, verifyToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');

describe('signToken / verifyToken', () => {
  test('signed token verifies correctly', () => {
    const payload = { id: 'user123', username: 'testuser' };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe('user123');
    expect(decoded.username).toBe('testuser');
  });

  test('expired token throws JsonWebTokenError', () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 'x' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    expect(() => verifyToken(token)).toThrow();
  });

  test('tampered token throws', () => {
    const token = signToken({ id: 'user456' });
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(() => verifyToken(tampered)).toThrow();
  });
});

describe('signRefreshToken / verifyRefreshToken', () => {
  test('refresh token verifies correctly', () => {
    const payload = { id: 'user789', tokenVersion: 0 };
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('user789');
  });

  test('tampered refresh token throws', () => {
    const token = signRefreshToken({ id: 'user999' });
    const tampered = token.slice(0, -4) + 'ZZZZ';
    expect(() => verifyRefreshToken(tampered)).toThrow();
  });
});
