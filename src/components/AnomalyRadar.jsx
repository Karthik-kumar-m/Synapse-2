import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  card: '#1A1A1A',
  border: '#333333',
  cyan: '#00FFCC',
  red: '#FF003C',
  yellow: '#FFD700',
  dim: '#777777',
  gridLine: '#222222',
};

const ANOMALY_THRESHOLD = 20;

const CHART_DATA = [
  { batch: 'B-01', packagingComplaints: 8,  botActivity: 2 },
  { batch: 'B-02', packagingComplaints: 7,  botActivity: 3 },
  { batch: 'B-03', packagingComplaints: 9,  botActivity: 2 },
  { batch: 'B-04', packagingComplaints: 11, botActivity: 4 },
  { batch: 'B-05', packagingComplaints: 10, botActivity: 3 },
  { batch: 'B-06', packagingComplaints: 12, botActivity: 5 },
  { batch: 'B-07', packagingComplaints: 13, botActivity: 4 },
  { batch: 'B-08', packagingComplaints: 14, botActivity: 6 },
  { batch: 'B-09', packagingComplaints: 15, botActivity: 7 },
  { batch: 'B-10', packagingComplaints: 34, botActivity: 18 },
];

function exportCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'synapse_anomaly_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#111111',
        border: `1px solid ${COLORS.border}`,
        padding: '10px 14px',
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px',
      }}>
        <div style={{ color: COLORS.dim, marginBottom: '6px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: '3px' }}>
            {p.name}: <strong>{p.value}%</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const styles = {
  wrapper: {
    backgroundColor: COLORS.card,
    border: `2px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    backgroundColor: '#111111',
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: COLORS.cyan,
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  exportBtn: {
    padding: '5px 14px',
    backgroundColor: 'transparent',
    border: `1px solid ${COLORS.cyan}`,
    color: COLORS.cyan,
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    cursor: 'pointer',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  alertBanner: {
    margin: '12px 16px 0 16px',
    padding: '10px 14px',
    backgroundColor: 'rgba(255,0,60,0.08)',
    border: `2px solid ${COLORS.red}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    color: COLORS.red,
  },
  alertIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  alertText: {
    lineHeight: '1.5',
  },
  alertBold: {
    fontWeight: '700',
    fontSize: '13px',
    display: 'block',
    marginBottom: '2px',
  },
  alertSub: {
    color: '#FF6680',
    fontSize: '10px',
    letterSpacing: '1px',
  },
  chartArea: {
    padding: '16px',
    flex: 1,
  },
  thresholdLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    fill: COLORS.yellow,
  },
};

export default function AnomalyRadar() {
  const [dismissed, setDismissed] = useState(false);

  const maxPackaging = Math.max(...CHART_DATA.map((d) => d.packagingComplaints));
  const spikeDetected = maxPackaging > ANOMALY_THRESHOLD;
  const spikePoint = CHART_DATA.find((d) => d.packagingComplaints === maxPackaging);

  return (
    <div style={styles.wrapper}>
      <div style={styles.panelHeader}>
        <span>⚠ ANOMALY RADAR</span>
        <button style={styles.exportBtn} onClick={() => exportCSV(CHART_DATA)}>
          ↓ EXPORT CSV
        </button>
      </div>

      {spikeDetected && !dismissed && (
        <div style={styles.alertBanner}>
          <span style={styles.alertIcon}>⚠</span>
          <div style={styles.alertText}>
            <span style={styles.alertBold}>
              ANOMALY DETECTED — {spikePoint?.batch}: Packaging Complaints at {maxPackaging}%
            </span>
            <span style={styles.alertSub}>
              THRESHOLD EXCEEDED BY {(maxPackaging - ANOMALY_THRESHOLD).toFixed(1)} PERCENTAGE POINTS ·
              ESCALATION RECOMMENDED
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: COLORS.red,
              cursor: 'pointer',
              fontFamily: "'Space Mono', monospace",
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={styles.chartArea}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={CHART_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.gridLine} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="batch"
              tick={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fill: COLORS.dim }}
              axisLine={{ stroke: COLORS.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fill: COLORS.dim }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 40]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: COLORS.dim,
                paddingTop: '12px',
              }}
            />
            <ReferenceLine
              y={ANOMALY_THRESHOLD}
              stroke={COLORS.yellow}
              strokeDasharray="4 4"
              label={{
                value: `THRESHOLD ${ANOMALY_THRESHOLD}%`,
                position: 'insideTopRight',
                style: styles.thresholdLabel,
              }}
            />
            <Line
              type="linear"
              dataKey="packagingComplaints"
              name="Packaging Complaints"
              stroke={COLORS.red}
              strokeWidth={2}
              dot={{ fill: COLORS.red, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: COLORS.red, strokeWidth: 0 }}
            />
            <Line
              type="linear"
              dataKey="botActivity"
              name="Bot Activity"
              stroke={COLORS.cyan}
              strokeWidth={2}
              dot={{ fill: COLORS.cyan, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: COLORS.cyan, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
