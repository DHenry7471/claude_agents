import { describe, it, expect } from 'vitest';
import {
  lookupAgent,
  lookupSkill,
  listAgents,
  listHorusAgents,
  listSkills,
  SLUG_ALIASES,
} from './registry.js';

describe('lookupAgent', () => {
  it('resolves a short alias to its full slug', () => {
    // Arrange
    const alias = 'felix';

    // Act
    const agent = lookupAgent(alias);

    // Assert
    expect(agent?.slug).toBe('felix-failure-triage');
  });

  it('resolves a Horus alias to its full Horus slug', () => {
    // Arrange
    const alias = 'horus-felix';

    // Act
    const agent = lookupAgent(alias);

    // Assert
    expect(agent?.slug).toBe('horus-felix-failure-triage');
    expect(agent?.horus).toBe(true);
  });

  it('resolves a full slug directly, without needing an alias entry', () => {
    // Arrange
    const fullSlug = 'tessa-test-strategist';

    // Act
    const agent = lookupAgent(fullSlug);

    // Assert
    expect(agent?.slug).toBe(fullSlug);
  });

  it('returns undefined for an unknown agent name', () => {
    // Arrange
    const unknown = 'not-a-real-agent';

    // Act
    const agent = lookupAgent(unknown);

    // Assert
    expect(agent).toBeUndefined();
  });

  it('has an alias entry for every agent listed in SLUG_ALIASES', () => {
    // Arrange
    const aliasTargets = Object.values(SLUG_ALIASES);

    // Act
    const resolved = aliasTargets.map(slug => lookupAgent(slug));

    // Assert — every alias must point at a real bundled agent, not a typo
    resolved.forEach((agent, i) => {
      expect(agent, `alias target "${aliasTargets[i]}" should resolve to a bundled agent`).toBeDefined();
    });
  });
});

describe('lookupSkill', () => {
  it('returns undefined for an unknown skill slug', () => {
    // Arrange
    const unknown = 'skill-testing-not-real';

    // Act
    const skill = lookupSkill(unknown);

    // Assert
    expect(skill).toBeUndefined();
  });

  it('resolves a real bundled skill by its full slug', () => {
    // Arrange
    const [firstSkill] = listSkills();

    // Act
    const skill = lookupSkill(firstSkill.slug);

    // Assert
    expect(skill).toEqual(firstSkill);
  });
});

describe('listAgents / listHorusAgents', () => {
  it('includes both standard and Horus agents in listAgents', () => {
    // Arrange / Act
    const all = listAgents();

    // Assert
    expect(all.some(a => a.horus === true)).toBe(true);
    expect(all.some(a => !a.horus)).toBe(true);
  });

  it('listHorusAgents returns only agents flagged horus: true', () => {
    // Arrange / Act
    const horusOnly = listHorusAgents();

    // Assert
    expect(horusOnly.length).toBeGreaterThan(0);
    horusOnly.forEach(a => expect(a.horus).toBe(true));
  });
});
