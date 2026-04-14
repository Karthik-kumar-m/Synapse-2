const COLORS = {
  bg: '#0D0D0D',
  card: '#1A1A1A',
  border: '#333333',
  cyan: '#00FFCC',
  red: '#FF003C',
  text: '#E0E0E0',
  dim: '#777777',
  yellow: '#FFD700',
  green: '#39FF14',
};

const SENTIMENT_DATA = [
  {
    feature: 'BATTERY',
    positive: 68,
    negative: 18,
    neutral: 14,
    total: 8_420,
  },
  {
    feature: 'PACKAGING',
    positive: 29,
    negative: 54,
    neutral: 17,
    total: 5_912,
  },
  {
    feature: 'DELIVERY',
    positive: 41,
    negative: 44,
    neutral: 15,
    total: 7_033,
  },
  {
    feature: 'BUILD QUALITY',
    positive: 73,
    negative: 14,
    neutral: 13,
    total: 6_241,
  },
  {
    feature: 'VALUE',
    positive: 38,
    negative: 47,
    neutral: 15,
    total: 5_108,
  },
  {
    feature: 'SUPPORT',
    positive: 59,
    negative: 28,
    neutral: 13,
    total: 4_502,
  },
];

const METRICS = [
  { label: 'TOTAL REVIEWS', value: '42,871', accent: COLORS.cyan, icon: '◈' },
  { label: 'AVG RATING', value: '3.64 ★', accent: COLORS.yellow, icon: '◉' },
  { label: 'VERIFIED PURCHASES', value: '31,204', accent: COLORS.green, icon: '✓' },
  { label: 'BOT SPAM QUARANTINED', value: '20', accent: COLORS.red, icon: '⚠', threat: true },
];

const styles = {
  wrapper: {
    backgroundColor: COLORS.card,
    border: `2px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
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
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  metricCard: (accent, threat) => ({
    padding: '20px 16px',
    borderRight: `1px solid ${COLORS.border}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: threat ? 'rgba(255,0,60,0.04)' : 'transparent',
  }),
  metricAccentBar: (accent) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '3px',
    height: '100%',
    backgroundColor: accent,
  }),
  metricIcon: (accent) => ({
    fontSize: '18px',
    color: accent,
    marginBottom: '8px',
    display: 'block',
  }),
  metricValue: (accent, threat) => ({
    fontFamily: "'Space Mono', monospace",
    fontSize: threat ? '36px' : '28px',
    fontWeight: '700',
    color: accent,
    lineHeight: '1',
    marginBottom: '6px',
  }),
  metricLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    color: COLORS.dim,
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  threatBadge: {
    display: 'inline-block',
    marginTop: '6px',
    padding: '2px 6px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.red}`,
    color: COLORS.red,
    fontSize: '9px',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '1px',
  },
  sentimentSection: {
    padding: '16px',
  },
  sectionTitle: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: COLORS.dim,
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginBottom: '14px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  featureCard: {
    backgroundColor: '#111111',
    border: `1px solid ${COLORS.border}`,
    padding: '12px',
  },
  featureName: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: COLORS.cyan,
    letterSpacing: '2px',
    marginBottom: '10px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  barLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    color: COLORS.dim,
    width: '22px',
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: '8px',
    backgroundColor: '#222222',
    position: 'relative',
  },
  barFill: (width, color) => ({
    height: '100%',
    width: `${width}%`,
    backgroundColor: color,
  }),
  barValue: (color) => ({
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: color,
    width: '30px',
    textAlign: 'right',
    flexShrink: 0,
  }),
  featureTotal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    color: '#444444',
    marginTop: '8px',
    textAlign: 'right',
  },
};

function SentimentBar({ label, value, color }) {
  return (
    <div style={styles.barRow}>
      <span style={styles.barLabel}>{label}</span>
      <div style={styles.barTrack}>
        <div style={styles.barFill(value, color)}></div>
      </div>
      <span style={styles.barValue(color)}>{value}%</span>
    </div>
  );
}

function FeatureCard({ feature, positive, negative, neutral, total }) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.featureName}>{feature}</div>
      <SentimentBar label="POS" value={positive} color={COLORS.green} />
      <SentimentBar label="NEG" value={negative} color={COLORS.red} />
      <SentimentBar label="NEU" value={neutral} color={COLORS.dim} />
      <div style={styles.featureTotal}>{total.toLocaleString()} reviews</div>
    </div>
  );
}

export default function IntelligenceGrid() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.panelHeader}>
        <span>◈</span> INTELLIGENCE GRID
      </div>

      <div style={styles.metricsRow}>
        {METRICS.map((m, i) => (
          <div key={i} style={styles.metricCard(m.accent, m.threat)}>
            <div style={styles.metricAccentBar(m.accent)}></div>
            <span style={styles.metricIcon(m.accent)}>{m.icon}</span>
            <div style={styles.metricValue(m.accent, m.threat)}>{m.value}</div>
            <div style={styles.metricLabel}>{m.label}</div>
            {m.threat && <span style={styles.threatBadge}>THREAT DETECTED</span>}
          </div>
        ))}
      </div>

      <div style={styles.sentimentSection}>
        <div style={styles.sectionTitle}>// Sentiment Breakdown by Feature</div>
        <div style={styles.featureGrid}>
          {SENTIMENT_DATA.map((d, i) => (
            <FeatureCard key={i} {...d} />
          ))}
        </div>
      </div>
    </div>
  );
}
