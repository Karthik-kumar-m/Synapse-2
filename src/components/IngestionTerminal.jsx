import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_STREAM = [
  '[INIT] Synapse Ingestion Engine v2.4.1 — ready.',
  '[UPLOAD] Awaiting CSV payload...',
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

const FEATURE_KEYWORDS = {
  BATTERY: ['battery', 'charge', 'power'],
  PACKAGING: ['package', 'packaging', 'box', 'wrap'],
  DELIVERY: ['deliver', 'shipping', 'courier', 'arrival'],
  'BUILD QUALITY': ['build', 'quality', 'material', 'design'],
  VALUE: ['price', 'value', 'cost', 'worth', 'expensive', 'cheap'],
  SUPPORT: ['support', 'service', 'customer', 'help'],
};

const POSITIVE_CUES = ['great', 'excellent', 'amazing', 'perfect', 'love', 'satisfied'];
const NEGATIVE_CUES = ['bad', 'terrible', 'disappointed', 'poor', 'broken', 'slow', 'late'];

function splitCsvLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  parts.push(current.trim());
  return parts;
}

function parseCsv(text) {
  const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!rows.length) return { headers: [], records: [] };

  const headers = splitCsvLine(rows[0]).map((h) => h.toLowerCase());
  const records = rows.slice(1).map((row) => {
    const values = splitCsvLine(row);
    return headers.reduce((acc, key, idx) => {
      acc[key] = values[idx] ?? '';
      return acc;
    }, {});
  });

  return { headers, records };
}

function pickFeature(text) {
  const lower = text.toLowerCase();
  const match = Object.entries(FEATURE_KEYWORDS).find(([, keywords]) =>
    keywords.some((k) => lower.includes(k)),
  );
  return match ? match[0] : 'GENERAL';
}

function sentimentFromRating(rating, text) {
  const lower = text.toLowerCase();
  if (rating >= 4 || POSITIVE_CUES.some((cue) => lower.includes(cue))) return 'positive';
  if (rating <= 2 || NEGATIVE_CUES.some((cue) => lower.includes(cue))) return 'negative';
  return 'neutral';
}

function cleanRecords(rawRecords) {
  let rejected = 0;
  const cleaned = rawRecords.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]),
    );
    const rating = Number(normalized.rating ?? normalized.score ?? normalized.stars);
    const review = (normalized.review_text ?? normalized.review ?? '').toString().trim();
    const verifiedRaw = (normalized.verified ?? normalized.verified_purchase ?? '').toString().toLowerCase();
    const verified = ['true', 'yes', '1', 'y'].includes(verifiedRaw);
    if (!Number.isFinite(rating) || !review) {
      rejected += 1;
      return null;
    }
    return {
      reviewId: normalized.review_id ?? normalized.id ?? '',
      productId: normalized.product_id ?? normalized.product ?? '',
      rating,
      reviewText: review,
      date: normalized.date ?? '',
      verified,
    };
  }).filter(Boolean);

  return { cleaned, rejected };
}

function computeIntelligence(records) {
  const featureStats = new Map();
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let ratingTotal = 0;
  let verifiedCount = 0;
  const botFingerprints = new Map();

  records.forEach((rec) => {
    ratingTotal += rec.rating;
    if (rec.verified) verifiedCount += 1;

    const feature = pickFeature(rec.reviewText);
    const sentiment = sentimentFromRating(rec.rating, rec.reviewText);
    if (!featureStats.has(feature)) {
      featureStats.set(feature, { feature, positive: 0, negative: 0, neutral: 0, total: 0 });
    }
    const stat = featureStats.get(feature);
    stat[sentiment] += 1;
    stat.total += 1;

    if (sentiment === 'positive') positive += 1;
    if (sentiment === 'negative') negative += 1;
    if (sentiment === 'neutral') neutral += 1;

    const fingerprint = rec.reviewText.toLowerCase().replace(/\s+/g, ' ').trim();
    botFingerprints.set(fingerprint, (botFingerprints.get(fingerprint) ?? 0) + 1);
  });

  const sentimentData = Array.from(featureStats.values())
    .sort((a, b) => b.total - a.total)
    .map((stat) => ({
      ...stat,
      positive: Math.round((stat.positive / stat.total) * 100),
      negative: Math.round((stat.negative / stat.total) * 100),
      neutral: Math.max(0, 100 - (Math.round((stat.positive / stat.total) * 100) + Math.round((stat.negative / stat.total) * 100))),
    }));

  const botFlags = Array.from(botFingerprints.values()).reduce(
    (acc, count) => acc + (count > 2 ? count - 1 : 0),
    0,
  );

  const metrics = [
    { label: 'TOTAL REVIEWS', value: records.length.toLocaleString(), accent: COLORS.cyan, icon: '◈' },
    {
      label: 'AVG RATING',
      value: records.length ? `${(ratingTotal / records.length).toFixed(2)} ★` : '0.00 ★',
      accent: COLORS.yellow,
      icon: '◉',
    },
    { label: 'VERIFIED PURCHASES', value: verifiedCount.toLocaleString(), accent: COLORS.text, icon: '✓' },
    { label: 'BOT SPAM QUARANTINED', value: botFlags.toString(), accent: COLORS.red, icon: '⚠', threat: true },
  ];

  return {
    metrics,
    sentimentData,
    botFlags,
    sentimentSummary: { positive, negative, neutral },
  };
}

function buildAnomalySeries(records, botFlags) {
  if (!records.length) return { chartData: [], spikeText: null };
  const batches = [];
  const batchSize = Math.max(1, Math.ceil(records.length / 10));

  for (let i = 0; i < records.length; i += batchSize) {
    const slice = records.slice(i, i + batchSize);
    const packagingNeg = slice.filter(
      (rec) => pickFeature(rec.reviewText) === 'PACKAGING' && sentimentFromRating(rec.rating, rec.reviewText) === 'negative',
    ).length;
    const botPct = Math.round((Math.min(botFlags, slice.length) / slice.length) * 100);
    batches.push({
      batch: `B-${String(batches.length + 1).padStart(2, '0')}`,
      packagingComplaints: Math.round((packagingNeg / slice.length) * 100),
      botActivity: botPct,
    });
  }

  const maxPackaging = Math.max(...batches.map((b) => b.packagingComplaints));
  const spike = maxPackaging > 20 ? `Packaging complaints spiked at ${maxPackaging}%` : null;

  return { chartData: batches, spikeText: spike };
}

function buildStream(fileName, headers, cleanCount, rejected, intelligence, anomalies) {
  const headerList = headers.length ? headers.join(', ') : 'none';
  const lines = [
    `[INIT] Synapse Ingestion Engine v2.4.1 — ready.`,
    `[UPLOAD] Received: ${fileName} — ${cleanCount + rejected} rows`,
    `[LAYER-1] Schema detected: ${headerList}`,
    `[LAYER-1] Valid rows: ${cleanCount} · Rejected: ${rejected}`,
  ];

  const total = intelligence.sentimentSummary.positive + intelligence.sentimentSummary.negative + intelligence.sentimentSummary.neutral;
  const positiveRate = total ? Math.round((intelligence.sentimentSummary.positive / total) * 100) : 0;
  const negativeRate = total ? Math.round((intelligence.sentimentSummary.negative / total) * 100) : 0;

  lines.push(
    `[LAYER-2] Feature extraction complete — ${intelligence.sentimentData.length} signals`,
    `[LAYER-2] Sentiment mix — POS ${positiveRate}% · NEG ${negativeRate}% · BOT flags ${intelligence.botFlags}`,
  );

  if (anomalies.spikeText) {
    lines.push(`[LAYER-3] Anomaly detected — ${anomalies.spikeText}`);
  } else {
    lines.push('[LAYER-3] Anomaly scan clear — no spikes over threshold');
  }

  lines.push('[DONE] Ingestion complete. Intelligence grid updated.');
  return lines;
}

export default function IngestionTerminal({ onProcessingComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [streamLines, setStreamLines] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [currentStream, setCurrentStream] = useState(DEFAULT_STREAM);
  const terminalRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamIndexRef = useRef(0);

  const startStream = useCallback((lines) => {
    setCurrentStream(lines);
    setStreamLines([]);
    setIsStreaming(true);
    setStreamDone(false);
    streamIndexRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isStreaming || !currentStream.length) return;
    const nextIndex = streamIndexRef.current;
    const line = currentStream[nextIndex];
    const delay = line.startsWith('[THREAT]') || line.startsWith('[ANOMALY]') ? 600 : 220;

    const timer = setTimeout(() => {
      setStreamLines((prev) => [...prev, line]);
      streamIndexRef.current += 1;
      if (streamIndexRef.current >= currentStream.length) {
        setStreamDone(true);
        setIsStreaming(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isStreaming, currentStream, streamLines.length]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamLines]);

  const processFile = useCallback(async (file) => {
    setUploadedFile(file);
    try {
      const text = await file.text();
      const { headers, records } = parseCsv(text);
      const { cleaned, rejected } = cleanRecords(records);
      const intelligence = computeIntelligence(cleaned);
      const anomalies = buildAnomalySeries(cleaned, intelligence.botFlags);
      const stream = buildStream(file.name, headers, cleaned.length, rejected, intelligence, anomalies);

      startStream(stream);
      onProcessingComplete?.({
        metrics: intelligence.metrics,
        sentimentData: intelligence.sentimentData,
        anomalies: { chartData: anomalies.chartData },
      });
    } catch (err) {
      const failure = [
        '[INIT] Synapse Ingestion Engine v2.4.1 — ready.',
        `[UPLOAD] Received: ${file.name}`,
        `[ERROR] Unable to parse CSV — ${err.message ?? 'Unexpected failure'}`,
      ];
      startStream(failure);
    }
  }, [onProcessingComplete, startStream]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

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
