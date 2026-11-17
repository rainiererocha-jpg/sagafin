// Fundo decorativo de "planejamento financeiro" (grade, curva de patrimônio, barras 50-30-20, anel de alocação).
// Versão React do SVG de scripts/brand/fundo.cjs, usado no manual e no motor social.
const W = 1200;
const H = 800;

function curva() {
  const n = 24;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = W * (0.04 + 0.92 * t);
    const y = H * (0.92 - (0.62 * (Math.pow(1.13, i) - 1)) / (Math.pow(1.13, n) - 1)) + Math.sin(i * 1.7) * H * 0.006;
    pts.push([x, y]);
  }
  return pts;
}

const PTS = curva();
const D = PTS.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const AREA = `${D} L${PTS[PTS.length - 1][0].toFixed(1)} ${H} L${PTS[0][0].toFixed(1)} ${H} Z`;
const R = W * 0.05;
const C = 2 * Math.PI * R;

export function FundoPlanejamento({ className = "" }: { className?: string }) {
  let acc = 0;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4a53c" stopOpacity="0.16" />
          <stop offset="1" stopColor="#d4a53c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="#d4a53c" strokeOpacity="0.06" strokeWidth="1">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 100} y1="0" x2={(i + 1) * 100} y2={H} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * 100} x2={W} y2={(i + 1) * 100} />
        ))}
      </g>
      <path d={AREA} fill="url(#fp-area)" />
      <path d={D} fill="none" stroke="#d4a53c" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      {[6, 12, 18, 24].map((i) => (
        <circle key={i} cx={PTS[i][0]} cy={PTS[i][1]} r="6" fill="#d4a53c" />
      ))}
      {[0.5, 0.3, 0.2].map((p, i) => (
        <rect
          key={p}
          x={W * 0.05 + i * 56}
          y={H * 0.95 - H * 0.32 * p}
          width="40"
          height={H * 0.32 * p}
          rx="2"
          fill="#d4a53c"
          fillOpacity={0.2 - i * 0.05}
        />
      ))}
      {[0.45, 0.25, 0.2, 0.1].map((f, i) => {
        const el = (
          <circle
            key={f}
            cx={W * 0.9}
            cy={H * 0.14}
            r={R}
            fill="none"
            stroke="#d4a53c"
            strokeOpacity={0.45 - i * 0.1}
            strokeWidth="16"
            strokeDasharray={`${C * f - 3} ${C}`}
            strokeDashoffset={-C * acc}
            transform={`rotate(-90 ${W * 0.9} ${H * 0.14})`}
          />
        );
        acc += f;
        return el;
      })}
    </svg>
  );
}

export const FUNDO_DEGRADE =
  "radial-gradient(ellipse 55% 60% at 78% 70%, rgba(212,165,60,.30), rgba(212,165,60,.07) 55%, transparent 75%)," +
  "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(212,165,60,.08), transparent 60%)," +
  "linear-gradient(165deg, #0b0b0b 0%, #12100c 38%, #1d160c 72%, #2b1f0b 100%)";
