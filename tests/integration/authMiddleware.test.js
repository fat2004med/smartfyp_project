import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { protect, authorize } from '../../middleware/auth.js';

describe('Integration Tests: Auth Middleware & RBAC', () => {
  const secret = process.env.JWT_SECRET || "fallback_secret";

  it('should reject requests without authorization header', async () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized, no token" });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject requests with invalid JWT tokens', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid_token_value' }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized, token failed" });
    expect(next).not.toHaveBeenCalled();
  });

  it('authorize middleware should allow user with matching role', () => {
    const middleware = authorize('Admin', 'HOD');
    const req = { user: { role: 'HOD, Supervisor' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('authorize middleware should block user without matching role', () => {
    const middleware = authorize('Admin');
    const req = { user: { role: 'Team Member' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('is not authorized') })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
