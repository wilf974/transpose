import type { TransposeResult, SongLine, ChordPosition } from './types';

const CHORD_REGEX = /^[A-G][b#]?(m|maj|min|dim|aug|sus|add)?[0-9]*(\/[A-G][b#]?)?$/;

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) return false;
  return tokens.every(t => CHORD_REGEX.test(t));
}

function parseChordproLine(line: string): SongLine {
  const chords: ChordPosition[] = [];
  const lyrics = line.replace(/\[([A-G][^\]]*)\](\S*)/g, (_, chord, word) => {
    chords.push({ word: word || '', chord });
    return word;
  });
  return { lyrics, chords };
}

function parseChordAboveLyrics(chordLine: string, lyricLine: string): SongLine {
  const chords: ChordPosition[] = [];
  const chordMatches = [...chordLine.matchAll(/([A-G][b#]?[^\s]*)\s*/g)];
  const lyricWords = lyricLine.split(/\s+/);

  for (const match of chordMatches) {
    const charPos = match.index ?? 0;
    let pos = 0;
    let bestWord = lyricWords[0] ?? '';
    for (const word of lyricWords) {
      if (pos <= charPos) bestWord = word;
      pos += word.length + 1;
    }
    chords.push({ word: bestWord, chord: match[1] });
  }

  return { lyrics: lyricLine, chords };
}

export function parseRawText(text: string): TransposeResult {
  if (!text.trim()) return { lines: [] };

  const hasChordpro = /\[[A-G][^\]]*\]/.test(text);

  if (hasChordpro) {
    const lines: SongLine[] = text
      .split('\n')
      .filter(l => l.trim())
      .map(parseChordproLine);
    return { lines };
  }

  const rawLines = text.split('\n');
  const lines: SongLine[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const current = rawLines[i];
    const next = rawLines[i + 1];

    if (isChordLine(current) && next !== undefined && !isChordLine(next)) {
      lines.push(parseChordAboveLyrics(current, next));
      i += 2;
    } else if (current.trim()) {
      lines.push({ lyrics: current, chords: [] });
      i++;
    } else {
      i++;
    }
  }

  return { lines };
}
