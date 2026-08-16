import { describe, it, expect } from 'vitest';
import { estimateAiProbability, compareTexts } from '../../utils/plagiarismChecker.js';

describe('Unit Tests: Plagiarism Checker & AI Estimator', () => {
  it('should return low AI probability for short plain text', () => {
    const text = "This is a simple student essay written manually.";
    const prob = estimateAiProbability(text);
    expect(prob).toBeGreaterThanOrEqual(8);
    expect(prob).toBeLessThan(50);
  });

  it('should estimate higher AI probability for text rich in AI buzzwords', () => {
    const text = "Furthermore, it is important to note that this testament to innovation plays a crucial role. Moreover, it creates a rich tapestry and a paradigm shift in the landscape of education. In conclusion, it is a holistic approach.";
    const prob = estimateAiProbability(text);
    expect(prob).toBeGreaterThan(40);
  });

  it('should return 0 similarity for empty texts', () => {
    const res = compareTexts("", "Some text");
    expect(res.score).toBe(0);
    expect(res.matches).toEqual([]);
  });

  it('should calculate non-zero similarity for overlapping text passages', () => {
    const text1 = "This project outlines a collaborative sprint planner, task logs tracking metrics, automated visual gantt boards, and role delegation schemas optimized for undergraduate final year projects.";
    const text2 = "The thesis presents a collaborative sprint planner, task logs tracking metrics, automated visual gantt boards, and role delegation schemas optimized for undergraduate final year projects.";
    const res = compareTexts(text1, text2);
    expect(res.score).toBeGreaterThan(50);
    expect(res.matches.length).toBeGreaterThan(0);
  });
});
