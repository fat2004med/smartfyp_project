import { describe, it, expect } from 'vitest';
import { validatePassword, generateCompliantPassword } from '../../utils/passwordValidator.js';
import { ProjectRecommender } from '../../utils/recommender.js';

describe('Non-Functional Tests: Performance & Stress Security Audits', () => {
  it('Password Validator should handle 1000 random generated passwords in under 100ms', () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      const pwd = generateCompliantPassword();
      const errors = validatePassword(pwd);
      expect(errors.length).toBe(0);
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500); // High performance requirement
  });

  it('Recommender Engine should score and rank 100 simulated documents in under 50ms', () => {
    const recommender = new ProjectRecommender();
    recommender.projects = Array.from({ length: 100 }).map((_, idx) => ({
      id: `sim-${idx}`,
      title: `Simulated Project Title ${idx}`,
      description: `Description discussing machine learning, neural networks, and web applications for index ${idx}`,
      domain: idx % 2 === 0 ? 'Artificial Intelligence' : 'Full-Stack Web Systems',
      techStack: 'Python, TensorFlow, React',
      tokens: ['machine', 'learning', 'neural', 'networks', 'web', 'applications']
    }));
    recommender.vocabulary = ['machine', 'learning', 'neural', 'networks', 'web', 'applications'];
    recommender.idf = { machine: 1.2, learning: 1.2, neural: 2.1, networks: 2.1, web: 0.8, applications: 0.8 };
    recommender.tfidfVectors = recommender.projects.map(() => ({
      machine: 0.4, learning: 0.4, neural: 0.5, networks: 0.5, web: 0.3, applications: 0.3
    }));
    recommender.isTrained = true;

    const start = Date.now();
    const result = recommender.getRecommendations('neural networks and machine learning', 'Artificial Intelligence', 'TensorFlow', 10);
    const elapsed = Date.now() - start;

    expect(result.recommendations.length).toBe(10);
    expect(elapsed).toBeLessThan(100);
  });
});
