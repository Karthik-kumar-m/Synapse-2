import { useState } from 'react';
import IngestionTerminal from './IngestionTerminal';
import IntelligenceGrid from './IntelligenceGrid';
import AnomalyRadar from './AnomalyRadar';

const styles = {
  root: {
    backgroundColor: '#0D0D0D',
    minHeight: '100vh',
    color: '#E0E0E0',
    fontFamily: "'Space Mono', 'Fira Code', monospace",
    padding: '0',
    margin: '0',
  },
  header: {
    backgroundColor: '#1A1A1A',
    borderBottom: '2px solid #00FFCC',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '22px',
    fontWeight: '700',
    color: '#00FFCC',
    letterSpacing: '4px',
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: '#555555',
    letterSpacing: '2px',
  },
  statusDot: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#00FFCC',
    fontFamily: "'Space Mono', monospace",
  },
  dot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#00FFCC',
    display: 'inline-block',
    animation: 'blink 1.2s step-end infinite',
  },
  main: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
};

export default function Dashboard() {
  const [intelData, setIntelData] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);

  const handleProcessingComplete = (payload) => {
    setIntelData({
      metrics: payload.metrics,
      sentimentData: payload.sentimentData,
    });
    setAnomalyData(payload.anomalies);
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #0D0D0D; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1A1A1A; }
        ::-webkit-scrollbar-thumb { background: #333333; }
        ::-webkit-scrollbar-thumb:hover { background: #00FFCC; }
      `}</style>

      <header style={styles.header}>
        <div>
          <div style={styles.logo}>⬡ SYNAPSE</div>
          <div style={styles.tagline}>// AI-POWERED CUSTOMER REVIEW INTELLIGENCE PLATFORM</div>
        </div>
        <div style={styles.statusDot}>
          <span style={styles.dot}></span>
          LLAMA 3.2 · ONLINE
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.fullWidth}>
          <IngestionTerminal onProcessingComplete={handleProcessingComplete} />
        </div>
        <IntelligenceGrid
          metrics={intelData?.metrics}
          sentimentData={intelData?.sentimentData}
        />
        <AnomalyRadar chartData={anomalyData?.chartData} />
      </main>
    </div>
  );
}
