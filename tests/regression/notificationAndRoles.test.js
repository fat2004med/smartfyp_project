import { describe, it, expect } from 'vitest';

describe('Regression Tests: Notification & Multi-Role Query Mechanics', () => {
  it('should construct correct query conditions for dual-role users (e.g. HOD, Supervisor)', () => {
    const user = { _id: 'user_dual', role: 'HOD, Supervisor' };
    const userRoles = user.role.split(',').map(r => r.trim());

    const query = { recipient: user._id };
    if (!userRoles.includes("Admin")) {
      const roleConditions = userRoles.map(role => ({
        targetRole: { $regex: new RegExp(`\\b${role}\\b`, 'i') }
      }));
      query.$or = [
        ...userRoles.map(role => ({ targetRole: role })),
        ...roleConditions,
        { targetRole: { $exists: false } },
        { targetRole: null }
      ];
    }

    expect(query.recipient).toBe('user_dual');
    expect(query.$or).toHaveLength(6); // 2 exact + 2 regex + exists:false + null
    expect(query.$or).toContainEqual({ targetRole: 'HOD' });
    expect(query.$or).toContainEqual({ targetRole: 'Supervisor' });
  });
});
