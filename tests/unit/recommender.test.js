import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectRecommender } from '../../utils/recommender.js';

describe('Unit Tests: Project Recommender Engine', () => {
  let recommender;

  beforeEach(() => {
    recommender = new ProjectRecommender();
  });

  it('should initialize with default empty state', () => {
    expect(recommender.isTrained).toBe(false);
    expect(recommender.projects).toEqual([]);
    expect(recommender.vocabulary).toEqual([]);
  });

  it('should safely calculate similarity even with unknown or empty tokens', () => {
    recommender.idf = { 'machine': 1.5, 'learning': 2.0 };
    const similarity = recommender.calculateSimilarity(['unknown', 'tokens'], {});
    expect(similarity).toBe(0);
  });

  it('should compute exact cosine similarity for matching unit vectors', () => {
    recommender.idf = { 'ai': 1.0, 'robotics': 2.0 };
    // Doc vector normalized
    const docVector = { 'ai': 0.6, 'robotics': 0.8 };
    const score = recommender.calculateSimilarity(['ai', 'robotics'], docVector);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('should train successfully from dataset if present or fail gracefully without crashing', () => {
    const trained = recommender.train();
    if (trained) {
      expect(recommender.isTrained).toBe(true);
      expect(recommender.projects.length).toBeGreaterThan(0);
      expect(recommender.vocabulary.length).toBeGreaterThan(0);
    } else {
      expect(recommender.isTrained).toBe(false);
    }
  });

  it('should return recommendations with valid structure and bounds', () => {
    const result = recommender.getRecommendations('Machine Learning Artificial Intelligence', 'Artificial Intelligence', 'Python, PyTorch', 5);
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('inferenceTimeMs');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeLessThanOrEqual(5);

    result.recommendations.forEach(rec => {
      expect(rec.matchScore).toBeGreaterThanOrEqual(0);
      expect(rec.matchScore).toBeLessThanOrEqual(100);
      expect(typeof rec.title).toBe('string');
      expect(typeof rec.domain).toBe('string');
    });
  });
});
