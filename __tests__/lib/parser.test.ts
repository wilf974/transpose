import { parseRawText } from '@/lib/parser';

describe('parseRawText', () => {
  it('parses chordpro format [Am]Amazing [G]grace', () => {
    const input = '[Am]Amazing [G]grace, how sweet the sound';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace, how sweet the sound');
    expect(result.lines[0].chords).toEqual([
      { word: 'Amazing', chord: 'Am' },
      { word: 'grace,', chord: 'G' },
    ]);
  });

  it('parses chord-above-lyrics format', () => {
    const input = 'Am       G\nAmazing grace';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace');
    expect(result.lines[0].chords.length).toBeGreaterThanOrEqual(1);
    expect(result.lines[0].chords[0].chord).toBe('Am');
  });

  it('parses plain lyrics with no chords', () => {
    const input = 'Amazing grace how sweet the sound';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lyrics).toBe('Amazing grace how sweet the sound');
    expect(result.lines[0].chords).toEqual([]);
  });

  it('handles multiple chordpro lines', () => {
    const input = '[Am]Amazing [G]grace\n[F]How sweet [C]the sound';
    const result = parseRawText(input);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[1].chords[0]).toEqual({ word: 'How', chord: 'F' });
  });

  it('handles empty string', () => {
    const result = parseRawText('');
    expect(result.lines).toHaveLength(0);
  });
});
