import { describe, it, expect, vi } from 'vitest';
import { createAnnouncement } from '../../controller/announcementController.js';

describe('Functional Tests: Role Hierarchy for Announcements', () => {
  it('should reject creation if no lower role is targeted by Team Member', async () => {
    const req = {
      user: { _id: 'user123', role: 'Team Member' },
      activeRole: 'Team Member',
      body: {
        title: 'Invalid Target Test',
        description: 'Test description',
        targetRoles: ['Admin', 'HOD'] // Team Member cannot target equal or higher roles
      }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    await createAnnouncement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('At least one valid target role lower than your own role') })
    );
  });
});
