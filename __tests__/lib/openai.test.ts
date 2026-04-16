import { transposeSong } from '@/lib/openai';

// Capture the mock create function so we can override it per-test
const mockCreate = jest.fn().mockResolvedValue({
  choices: [{
    message: {
      content: JSON.stringify({
        lines: [
          { lyrics: 'Amazing grace', chords: [{ word: 'Amazing', chord: 'Am' }] }
        ]
      })
    }
  }]
});

jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        }
      }
    }))
  };
});

describe('transposeSong', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('returns a TransposeResult with lines', async () => {
    const result = await transposeSong('Amazing grace', 'C');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace');
    expect(result.lines[0].chords[0].chord).toBe('Am');
  });

  it('throws if OpenAI returns empty response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }]
    });
    await expect(transposeSong('test', 'C')).rejects.toThrow('OpenAI returned empty response');
  });
});
