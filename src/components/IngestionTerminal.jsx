import { useState, useEffect, useRef, useCallback } from 'react';

const MOCK_STREAM = [
  '[INIT] Synapse Ingestion Engine v2.4.1 — ready.',
  '[UPLOAD] Received: ecommerce_reviews_q4_2024.csv (14.2 MB, 42,871 rows)',
  '[PARSE] Detecting delimiter... COMMA ✓',
  '[PARSE] Columns detected: review_id, product_id, rating, review_text, date, verified',
  '[INGEST] KAG-1001 >> "Great battery life, charges super fast!" — Rating: 5',
  '[EXTRACT] >> FEATURE: BATTERY · SENTIMENT: POSITIVE · SCORE: 0.94',
  '[INGEST] KAG-1002 >> "Packaging was torn on arrival, very disappointed." — Rating: 2',
  '[EXTRACT] >> FEATURE: PACKAGING · SENTIMENT: NEGATIVE · SCORE: 0.87',
  '[INGEST] KAG-1003 >> "Delivery took 3 weeks, unacceptable." — Rating: 1',
  '[EXTRACT] >> FEATURE: DELIVERY · SENTIMENT: NEGATIVE · SCORE: 0.91',
  '[INGEST] KAG-1429 >> "Amazing screen quality and build!" — Rating: 5',
  '[EXTRACT] >> FEATURE: BUILD_QUALITY · SENTIMENT: POSITIVE · SCORE: 0.96',
  '[ANOMALY] Batch #7 — Packaging complaint spike detected: 34.2% above baseline',
  '[THREAT] Suspected bot cluster: 12 reviews — IP range 192.168.77.x — QUARANTINED',
  '[INGEST] KAG-1430 >> "Does not match product description at all." — Rating: 1',
  '[EXTRACT] >> FEATURE: ACCURACY · SENTIMENT: NEGATIVE · SCORE: 0.89',
  '[INGEST] KAG-1431 >> "Customer support was incredibly helpful." — Rating: 5',
  '[EXTRACT] >> FEATURE: SUPPORT · SENTIMENT: POSITIVE · SCORE: 0.93',
  '[THREAT] Suspected bot cluster: 8 reviews — IP range 10.44.20.x — QUARANTINED',
  '[INGEST] KAG-2100 >> "Price is too high for the quality offered." — Rating: 2',
  '[EXTRACT] >> FEATURE: VALUE · SENTIMENT: NEGATIVE · SCORE: 0.82',
  '[INGEST] KAG-2101 >> "Works exactly as described, very satisfied!" — Rating: 4',
  '[EXTRACT] >> FEATURE: ACCURACY · SENTIMENT: POSITIVE · SCORE: 0.78',
  '[NLP] LLM summarisation pass complete — 42,871 / 42,871 records processed',
  '[DONE] Ingestion complete. Intelligence grid updated. 20 bots quarantined.',
];

const COLORS = {
  bg: '#0D0D0D',
  card: '#1A1A1A',
  border: '#333333',
  cyan: '#00FFCC',
  red: '#FF003C',
  text: '#E0E0E0',
  dim: '#777777',
  yellow: '#FFD700',
};

const styles = {
  wrapper: {
    backgroundColor: COLORS.card,
    border: `2px solid ${COLORS.border}`,
  },
  panelHeader: {
    backgroundColor: '#111111',
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: COLORS.cyan,
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  dropZone: (isDragging) => ({
    border: `2px dashed ${isDragging ? COLORS.cyan : COLORS.border}`,
    backgroundColor: isDragging ? 'rgba(0,255,204,0.05)' : 'transparent',
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s',
    margin: '16px',
  }),
  dropIcon: {
    fontSize: '32px',
    marginBottom: '12px',
    color: COLORS.cyan,
  },
  dropLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '13px',
    color: COLORS.dim,
    lineHeight: '1.8',
  },
  dropHighlight: {
    color: COLORS.cyan,
    fontWeight: '700',
  },
  fileInput: {
    display: 'none',
  },
  uploadBtn: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '8px 20px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.cyan}`,
    color: COLORS.cyan,
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    cursor: 'pointer',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  terminalWrapper: {
    borderTop: `1px solid ${COLORS.border}`,
    margin: '0 16px 16px 16px',
  },
  terminalHeader: {
    backgroundColor: '#0a0a0a',
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '6px 12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  terminalDot: (color) => ({
    width: '10px',
    height: '10px',
    backgroundColor: color,
    display: 'inline-block',
  }),
  terminalTitle: {
    marginLeft: '8px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: COLORS.dim,
    letterSpacing: '1px',
  },
  terminalBody: {
    backgroundColor: '#0a0a0a',
    padding: '12px',
    height: '200px',
    overflowY: 'auto',
    fontFamily: "'Space Mono', 'Fira Code', monospace",
    fontSize: '12px',
    lineHeight: '1.8',
  },
  terminalLine: (line) => {
    if (line.startsWith('[THREAT]') || line.startsWith('[ANOMALY]')) return { color: COLORS.red };
    if (line.startsWith('[DONE]') || line.startsWith('[EXTRACT]')) return { color: COLORS.cyan };
    if (line.startsWith('[UPLOAD]') || line.startsWith('[PARSE]')) return { color: COLORS.yellow };
    return { color: '#AAAAAA' };
  },
  cursor: {
    display: 'inline-block',
    width: '8px',
    height: '14px',
    backgroundColor: COLORS.cyan,
    verticalAlign: 'middle',
    animation: 'blink 0.8s step-end infinite',
    marginLeft: '4px',
  },
};

export default function IngestionTerminal() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [streamLines, setStreamLines] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const terminalRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamIndexRef = useRef(0);

  const startStream = useCallback(() => {
    setStreamLines([]);
    setIsStreaming(true);
    setStreamDone(false);
    streamIndexRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isStreaming) return;
    if (streamIndexRef.current >= MOCK_STREAM.length) {
      setIsStreaming(false);
      setStreamDone(true);
      return;
    }
    const delay = MOCK_STREAM[streamIndexRef.current].startsWith('[THREAT]') ||
      MOCK_STREAM[streamIndexRef.current].startsWith('[ANOMALY]') ? 600 : 220;
    const timer = setTimeout(() => {
      setStreamLines((prev) => [...prev, MOCK_STREAM[streamIndexRef.current]]);
      streamIndexRef.current += 1;
    }, delay);
    return () => clearTimeout(timer);
  }, [isStreaming, streamLines]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamLines]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      startStream();
    }
  }, [startStream]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      startStream();
    }
  }, [startStream]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.panelHeader}>
        <span>▶</span> INGESTION TERMINAL
        {uploadedFile && (
          <span style={{ color: COLORS.dim, marginLeft: 'auto' }}>
            {uploadedFile.name}
          </span>
        )}
      </div>

      <div
        style={styles.dropZone(isDragging)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={styles.dropIcon}>⬡</div>
        <div style={styles.dropLabel}>
          <span style={styles.dropHighlight}>DRAG & DROP</span> a CSV file here<br />
          or click to select · Accepted: <span style={styles.dropHighlight}>.csv</span>
        </div>
        <button style={styles.uploadBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          SELECT FILE
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={styles.fileInput}
          onChange={handleFileChange}
        />
      </div>

      <div style={styles.terminalWrapper}>
        <div style={styles.terminalHeader}>
          <span style={styles.terminalDot('#FF5F57')}></span>
          <span style={styles.terminalDot('#FEBC2E')}></span>
          <span style={styles.terminalDot('#28C840')}></span>
          <span style={styles.terminalTitle}>synapse-engine — ingestion-stream</span>
        </div>
        <div style={styles.terminalBody} ref={terminalRef}>
          {streamLines.length === 0 && !isStreaming && (
            <span style={{ color: COLORS.dim }}>// Awaiting CSV upload to begin ingestion stream...</span>
          )}
          {streamLines.map((line, i) => (
            <div key={i} style={styles.terminalLine(line)}>
              <span style={{ color: COLORS.dim, marginRight: '8px' }}>$</span>
              {line}
            </div>
          ))}
          {isStreaming && <span style={styles.cursor}></span>}
          {streamDone && (
            <div style={{ color: COLORS.cyan, marginTop: '8px' }}>
              <span style={{ color: COLORS.dim }}>$</span> ■ STREAM COMPLETE — intelligence grid updated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
