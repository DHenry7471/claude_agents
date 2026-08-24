import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the Anthropic SDK so no real API calls are made. `mockCreate` is
// reconfigured per test via mockResolvedValueOnce / mockRejectedValueOnce.
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropicClient {
    messages = { create: mockCreate };
  }
  return { default: MockAnthropicClient };
});

const { runAgent, runHorusAgent } = await import('./api.js');
const { listAgents, listHorusAgents } = await import('./registry.js');

const standardAgent = listAgents().find(a => !a.horus)!;
const horusAgent = listHorusAgents()[0]!;

function fakeMessage(text: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_read_input_tokens: 10,
      cache_creation_input_tokens: 5,
    },
    ...overrides,
  };
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe('runAgent', () => {
  it('throws when no API key is available', async () => {
    // Arrange
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    // Act / Assert
    await expect(runAgent(standardAgent.slug, 'do something')).rejects.toThrow(
      /ANTHROPIC_API_KEY is not set/
    );

    // Cleanup
    if (previousKey !== undefined) process.env.ANTHROPIC_API_KEY = previousKey;
  });

  it('throws for an unknown agent name', async () => {
    // Arrange / Act / Assert
    await expect(
      runAgent('not-a-real-agent', 'do something', { apiKey: 'test-key' })
    ).rejects.toThrow(/Unknown agent "not-a-real-agent"/);
  });

  it('rejects a Horus agent — direct callers to runHorusAgent instead', async () => {
    // Arrange / Act / Assert
    await expect(
      runAgent(horusAgent.slug, 'do something', { apiKey: 'test-key' })
    ).rejects.toThrow(/Use runHorusAgent\(\)/);
  });

  it('returns a mapped AgentResult on success', async () => {
    // Arrange
    mockCreate.mockResolvedValueOnce(fakeMessage('the agent output'));

    // Act
    const result = await runAgent(standardAgent.slug, 'do something', { apiKey: 'test-key' });

    // Assert
    expect(result.output).toBe('the agent output');
    expect(result.agent).toBe(standardAgent.slug);
    expect(result.stopReason).toBe('end_turn');
    expect(result.usage).toEqual({
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 10,
      cacheCreationTokens: 5,
    });
  });

  it('prefers an explicit model option over the agent default', async () => {
    // Arrange
    mockCreate.mockResolvedValueOnce(fakeMessage('output'));

    // Act
    const result = await runAgent(standardAgent.slug, 'task', {
      apiKey: 'test-key',
      model: 'claude-opus-4-8',
    });

    // Assert
    expect(result.model).toBe('claude-opus-4-8');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-opus-4-8' }));
  });

  it('falls back to the agent default model when nothing overrides it', async () => {
    // Arrange
    const previousEnvModel = process.env.CLAUDE_AGENTS_MODEL;
    delete process.env.CLAUDE_AGENTS_MODEL;
    mockCreate.mockResolvedValueOnce(fakeMessage('output'));

    // Act
    const result = await runAgent(standardAgent.slug, 'task', { apiKey: 'test-key' });

    // Assert
    expect(result.model).toBe(standardAgent.model);

    // Cleanup
    if (previousEnvModel !== undefined) process.env.CLAUDE_AGENTS_MODEL = previousEnvModel;
  });
});

describe('runHorusAgent', () => {
  it('throws when the resolved agent is not a Horus variant', async () => {
    // Arrange / Act / Assert
    await expect(
      runHorusAgent(standardAgent.slug, { some: 'data' }, { apiKey: 'test-key' })
    ).rejects.toThrow(/is not a Horus variant/);
  });

  it('throws for an unknown Horus agent name', async () => {
    // Arrange / Act / Assert
    await expect(
      runHorusAgent('not-a-real-horus-agent', {}, { apiKey: 'test-key' })
    ).rejects.toThrow(/Unknown Horus agent/);
  });

  it('parses JSON from a ```json fenced code block', async () => {
    // Arrange
    mockCreate.mockResolvedValueOnce(
      fakeMessage('Some preamble text.\n\n```json\n{"verdict": "BLOCK"}\n```\n')
    );

    // Act
    const result = await runHorusAgent(horusAgent.slug, { some: 'input' }, { apiKey: 'test-key' });

    // Assert
    expect(result.data).toEqual({ verdict: 'BLOCK' });
  });

  it('parses JSON from an unfenced plain-text response', async () => {
    // Arrange
    mockCreate.mockResolvedValueOnce(fakeMessage('{"verdict": "ALLOW"}'));

    // Act
    const result = await runHorusAgent(horusAgent.slug, { some: 'input' }, { apiKey: 'test-key' });

    // Assert
    expect(result.data).toEqual({ verdict: 'ALLOW' });
  });

  it('throws a descriptive error when the response is not valid JSON', async () => {
    // Arrange
    mockCreate.mockResolvedValueOnce(fakeMessage('this is not JSON at all'));

    // Act / Assert
    await expect(
      runHorusAgent(horusAgent.slug, { some: 'input' }, { apiKey: 'test-key' })
    ).rejects.toThrow(/did not return valid JSON/);
  });

  it('serialises the input object as the user message', async () => {
    // Arrange
    mockCreate.mockResolvedValueOnce(fakeMessage('{"ok": true}'));
    const input = { runId: 'abc-123', branch: 'main' };

    // Act
    await runHorusAgent(horusAgent.slug, input, { apiKey: 'test-key' });

    // Assert
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: JSON.stringify(input, null, 2) }],
      })
    );
  });
});
