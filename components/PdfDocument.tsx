import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { TransposeResult } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Courier',
  },
  line: {
    marginBottom: 12,
  },
  chordRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 1,
  },
  chord: {
    fontSize: 9,
    color: '#6d28d9',
    fontWeight: 'bold',
  },
  lyrics: {
    fontSize: 11,
    color: '#1a1a1a',
  },
});

interface PdfDocumentProps {
  result: TransposeResult;
  title?: string;
}

export default function TransposePdfDocument({ result, title }: PdfDocumentProps) {
  return (
    <Document title={title ?? 'Transpose'}>
      <Page size="A4" style={styles.page}>
        {result.lines.map((line, i) => (
          <View key={i} style={styles.line}>
            {line.chords.length > 0 && (
              <View style={styles.chordRow}>
                {line.chords.map((cp, j) => (
                  <Text key={j} style={styles.chord}>{cp.chord}</Text>
                ))}
              </View>
            )}
            <Text style={styles.lyrics}>{line.lyrics}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
