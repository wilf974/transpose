export type MusicalKey =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E'
  | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A'
  | 'A#' | 'Bb' | 'B';

export const MUSICAL_KEYS: MusicalKey[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

export interface ChordPosition {
  /** The word above which the chord appears */
  word: string;
  /** The chord symbol, e.g. "Am", "G7", "F#m" */
  chord: string;
}

export interface SongLine {
  /** The lyric text for this line */
  lyrics: string;
  /** Chords positioned at specific words in this line */
  chords: ChordPosition[];
}

export interface TransposeResult {
  lines: SongLine[];
}

export type InputMode = 'text' | 'txt' | 'pdf';
