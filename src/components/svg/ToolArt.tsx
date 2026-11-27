import { motion } from 'framer-motion';
import type { ToolProfile } from '../../types';
import type { ToolGuide } from '../../data/library';

/** Tip silhouettes, drawn tip-right at roughly 1:1 proportion of a 0.025" pick profile. */
const TIP: Partial<Record<ToolProfile, string>> = {
  'short-hook': 'M0 30H168Q176 30 178 24L180 15Q181 11 185 12L186 16Q184 26 181 32Q178 36 168 36H0Z',
  'medium-hook': 'M0 30H164Q172 30 175 22L179 8Q180 4 184 5L185 9Q182 24 179 32Q176 36 164 36H0Z',
  'deep-hook': 'M0 30H158Q168 30 172 18L177 -2Q178 -6 182 -5L183 -1Q179 22 175 32Q172 36 158 36H0Z',
  'gonzo-hook': 'M0 30H160Q168 30 172 22L184 6Q186 3 189 5L189 9Q180 24 175 32Q172 36 160 36H0Z',
  'half-diamond': 'M0 30H160L174 14L186 30Q188 36 180 36H0Z',
  ball: 'M0 30H166Q168 18 177 18Q186 18 187 30Q187 36 180 36H0Z',
  bogota: 'M0 30H120Q126 18 132 30Q138 18 144 30Q150 16 158 30Q162 36 156 36H0Z',
  'city-rake': 'M0 30H112L118 20L124 26L130 16L138 24L144 14L152 22L158 22L164 30Q166 36 160 36H0Z',
  snake: 'M0 30H112Q118 18 126 26Q134 34 142 22Q150 12 158 26Q162 34 168 30Q170 36 162 36H0Z',
  'w-rake': 'M0 30H120L126 20L132 30L138 20L144 30L150 20L156 30L162 20L168 30Q170 36 164 36H0Z',
  'batman-2': 'M0 30H112Q119 15 127 24Q133 30 139 22Q146 13 154 26L166 31Q170 33 166 35L154 40Q146 53 139 44Q133 36 127 42Q119 51 112 36H0Z',
  'batman-3': 'M0 30H108Q113 15 120 24Q125 30 130 22Q136 13 142 24Q147 30 152 22Q158 13 165 26L174 31Q178 33 174 35L165 40Q158 53 152 44Q147 36 142 42Q136 53 130 44Q125 36 120 42Q113 51 108 36H0Z',
  'double-ball': 'M0 30H148Q150 20 158 20Q166 20 167 28Q169 20 177 20Q186 20 186 30Q186 36 180 36H0Z',
  'dimple-flag': 'M0 30H170V21H180V30Q184 30 184 33Q184 36 180 36H0Z',
  'lever-pick': 'M0 30H158Q165 30 167 23L169 6Q170 2 174 3L175 7L173 24Q171 36 158 36H0Z',
  'key-extractor': 'M0 30H120V25L128 30V25L136 30V25L144 30V25L152 30H170L184 33L170 36H0Z',
  'comb-pick': 'M0 30H110V18H114V30H122V18H126V30H134V18H138V30H146V18H150V30H158V18H162V30H170Q182 30 182 36H0Z',
  'bump-key': 'M0 24H110L116 33L122 24L128 33L134 24L140 33L146 24L152 33L158 24H174L186 31L174 40H0Z',
  'disc-pick': 'M0 28H150V22H172V18H184V40H172V36H150V34H0Z',
  'tubular-pick': 'M0 24H140V18H186V44H140V38H0Z',
  'wafer-jiggler': 'M0 28H120L128 20H136L142 28L150 18H158L166 28L172 22L182 30V36H0Z',
  'bypass-shim': 'M0 28H160Q186 28 186 40H176Q174 34 160 34H0Z',
  'plug-spinner': 'M0 26H120V22H140V40H120V36H0ZM146 31a12 12 0 1 0 24 0a12 12 0 1 0 -24 0',
  other: 'M0 30H170Q180 30 182 26L184 30Q182 36 170 36H0Z',
};

export function ToolArt({ profile, className = '' }: { profile: ToolProfile; className?: string }) {
  const id = `ta-${profile}`;
  const isTension = profile === 'tok-bar' || profile === 'bok-wrench' || profile === 'twist-wrench';
  const tall = profile === 'batman-2' || profile === 'batman-3';
  return (
    <svg viewBox={isTension ? '-4 -10 200 56' : tall ? '64 4 130 58' : '64 -10 130 56'} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
      </defs>
      {isTension ? (
        profile === 'tok-bar' ? (
          <g>
            <path d="M10 10H150V18H10Z" fill={`url(#${id})`} stroke="#0f172a" strokeWidth={0.6} />
            <path d="M150 10L186 10L186 18L150 18Z" fill={`url(#${id})`} stroke="#0f172a" strokeWidth={0.6} transform="skewX(-12) translate(4 0)" />
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={i} x1={166 + i * 4} x2={164 + i * 4} y1={10} y2={18} stroke="#334155" />
            ))}
            <text x={80} y={36} fontSize={9} fill="#64748b" textAnchor="middle">
              plochý, zaklíní se nahoře v profilu
            </text>
          </g>
        ) : profile === 'bok-wrench' ? (
          <g>
            <path d="M10 6H24V30H160V36H18V6Z" fill={`url(#${id})`} stroke="#0f172a" strokeWidth={0.6} />
            <path d="M160 30H180V22H186V36H160Z" fill={`url(#${id})`} stroke="#0f172a" strokeWidth={0.6} />
          </g>
        ) : (
          <g>
            <path d="M10 6H20V30H60Q70 22 80 30T100 30T120 30T140 30H180V36H14V6Z" fill={`url(#${id})`} stroke="#0f172a" strokeWidth={0.6} />
          </g>
        )
      ) : (
        <g>
          <rect x={-4} y={26} width={70} height={14} rx={6} fill="#0f172a" stroke="#eab308" strokeOpacity={0.6} />
          <path d={TIP[profile] ?? TIP.other!} fill={`url(#${id})`} stroke="#0f172a" strokeWidth={0.6} fillRule="evenodd" />
          <rect x={-4} y={26} width={70} height={14} rx={6} fill="#111827" stroke="#eab308" strokeOpacity={0.6} />
        </g>
      )}
    </svg>
  );
}

/** Mini cutaway showing the hand motion for a tool. */
const C = {
  housing: '#D9DCE3',
  housingStroke: '#8E8E93',
  plug: '#CFE3FF',
  plugStroke: '#4A90E2',
  keyway: '#3A3A3C',
  driver: '#B9BFCB',
  key: '#F2B544',
  shear: '#FF9500',
  tool: '#0A6CFF',
  wrench: '#21A44A',
  text: '#8E8E93',
};

function Caption({ children }: { children: string }) {
  return (
    <text x={112} y={117} textAnchor="middle" fontSize={8} fontWeight={600} fill={C.text} fontFamily="-apple-system, 'Inter Variable', sans-serif">
      {children}
    </text>
  );
}

export function ToolMotionDemo({ guide }: { guide: ToolGuide }) {
  const pins = [0, 1, 2, 3, 4];
  const pinX = (i: number) => 60 + i * 28;
  const keyLens = [22, 30, 16, 26, 20];
  const D = guide.motion === 'yank' ? 2.6 : 3.2;
  const repeat = { repeat: Infinity, duration: D, ease: 'easeInOut' as const };

  const motionFor = () => {
    switch (guide.motion) {
      case 'lift':
        return { x: [0, 84, 84, 84, 0], y: [0, 0, -10, 0, 0], rotate: [0, 0, -4, 0, 0] };
      case 'deep-lift':
        return { x: [0, 112, 112, 112, 0], y: [0, 0, -14, 0, 0], rotate: [0, 0, -4, 0, 0] };
      case 'rake-rock':
        return { x: [0, 90, 40, 95, 30, 90, 0], y: [0, -6, 0, -8, -2, -6, 0], rotate: [0, -5, 3, -6, 2, -4, 0] };
      case 'rake-scrub':
        return { x: [0, 110, 20, 110, 20, 110, 0], y: [0, -4, -4, -4, -4, -4, 0], rotate: [0, 0, 0, 0, 0, 0, 0] };
      case 'zip':
        return { x: [0, 120, 120, 0, 0], y: [0, 0, -9, -9, 0], rotate: [0, 0, 0, 0, 0] };
      case 'yank':
        // slide in, small wiggle under light tension, then a fast pull out
        return { x: [0, 112, 112, 110, 0, 0], y: [0, 0, -3, 2, -2, 0], rotate: [0, 0, -2, 2, 0, 0] };
      default:
        return { x: [0, 60, 0], y: [0, 0, 0], rotate: [0, 0, 0] };
    }
  };

  if (guide.motion === 'tension-tok' || guide.motion === 'tension-bok') {
    const top = guide.motion === 'tension-tok';
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <circle cx={100} cy={56} r={48} fill={C.housing} stroke={C.housingStroke} />
        <motion.g style={{ originX: '100px', originY: '56px' }} animate={{ rotate: [0, 0, 8, 8, 0] }} transition={repeat}>
          <circle cx={100} cy={56} r={33} fill={C.plug} stroke={C.plugStroke} />
          <path d="M96 28h8v10l4 5-4 5v8l3 4-3 4v14h-8v-10l-3-4 3-4v-8l-4-5 4-5z" fill={C.keyway} />
          {top ? <rect x={95} y={26} width={10} height={5} rx={1} fill={C.wrench} /> : <rect x={95} y={80} width={10} height={5} rx={1} fill={C.wrench} />}
        </motion.g>
        <motion.g animate={{ rotate: [0, 0, 8, 8, 0] }} transition={repeat} style={{ originX: '100px', originY: '56px' }}>
          {top ? <rect x={98} y={0} width={4} height={28} rx={2} fill={C.wrench} /> : <rect x={98} y={84} width={4} height={24} rx={2} fill={C.wrench} />}
        </motion.g>
        <Caption>{top ? 'TOK – napínák nahoře, pod stavítky zůstane místo' : 'BOK – napínák dole v otvoru'}</Caption>
      </svg>
    );
  }
  if (guide.motion === 'disc-rotate') {
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        {[0, 1, 2].map((i) => (
          <motion.g key={i} style={{ originX: `${60 + i * 40}px`, originY: '56px' }} animate={{ rotate: [i * 50, i * 50, 0, 0, i * 50] }} transition={{ ...repeat, delay: i * 0.2 }}>
            <circle cx={60 + i * 40} cy={56} r={26} fill={C.driver} stroke={C.housingStroke} />
            <rect x={56 + i * 40} y={30} width={8} height={6} fill={C.keyway} />
            <path d={`M${60 + i * 40} 48a8 8 0 0 1 0 16z`} fill={C.keyway} />
          </motion.g>
        ))}
        <Caption>disky se otáčí, dokud výřezy nejsou v řadě</Caption>
      </svg>
    );
  }
  if (guide.motion === 'extract') {
    const t = { repeat: Infinity, duration: 4, ease: 'easeInOut' as const, times: [0, 0.35, 0.5, 0.85, 1] };
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <rect x={30} y={10} width={164} height={96} rx={8} fill={C.housing} stroke={C.housingStroke} />
        <rect x={34} y={52} width={156} height={50} rx={5} fill={C.plug} stroke={C.plugStroke} />
        <line x1={30} x2={194} y1={52} y2={52} stroke={C.shear} strokeDasharray="4 3" />
        {/* broken key fragment */}
        <motion.g animate={{ x: [0, 0, 0, -150, -150] }} transition={t}>
          <path d="M100 76L108 70L116 76L124 68L132 76L140 70L148 76L160 76L168 82L160 90H100Z" fill={C.key} stroke="#B7791F" strokeWidth={0.8} />
          <path d="M100 76V90" stroke="#B7791F" strokeWidth={1.2} strokeDasharray="2 2" />
        </motion.g>
        {/* extractor slides in under the fragment's cuts, then pulls it out */}
        <motion.g animate={{ x: [-150, 0, 0, -150, -150], y: [0, 0, -3, -3, 0] }} transition={t}>
          <path d="M0 90H104V86L112 90V86L120 90V86L128 90V86L136 90H160L170 92L160 95H0Z" fill={C.tool} />
        </motion.g>
        <rect x={20} y={88} width={14} height={8} fill="#cbd5e1" />
        <Caption>zasunout, zakousnout do zubů klíče, vytáhnout</Caption>
      </svg>
    );
  }
  if (guide.motion === 'none') {
    return (
      <div className="flex h-full items-center justify-center">
        <ToolArt profile={guide.profile} className="w-4/5" />
      </div>
    );
  }

  const m = motionFor();
  const times = m.x.length === 5 ? [0, 0.3, 0.55, 0.75, 1] : m.x.length === 6 ? [0, 0.35, 0.5, 0.62, 0.72, 1] : undefined;
  const liftsFor = (i: number) => {
    if (guide.motion === 'lift') return i === 3 ? [0, 0, -10, 0, 0] : [0, 0, 0, 0, 0];
    if (guide.motion === 'deep-lift') return i === 4 ? [0, 0, -14, 0, 0] : [0, 0, 0, 0, 0];
    if (guide.motion === 'zip') return [0, 0, -6, -6, 0].map((v, k) => (k === 3 ? 0 : v));
    if (guide.motion === 'yank') return [0, -6 - (i % 2) * 3, -4, -2, -10 + (i % 3) * 2, 0];
    return [0, -6 - (i % 2) * 4, 0, -8 + (i % 3) * 2, -2, -6, 0];
  };
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <rect x={30} y={10} width={164} height={96} rx={8} fill={C.housing} stroke={C.housingStroke} />
      <rect x={34} y={52} width={156} height={50} rx={5} fill={C.plug} stroke={C.plugStroke} />
      <rect x={34} y={84} width={156} height={12} fill={C.keyway} opacity={0.85} />
      {pins.map((i) => (
        <g key={i}>
          <rect x={pinX(i) - 7} y={14} width={14} height={70} fill="#000" opacity={0.07} />
          <motion.g animate={{ y: liftsFor(i) }} transition={{ ...repeat, times: liftsFor(i).length === 5 ? [0, 0.3, 0.55, 0.75, 1] : liftsFor(i).length === 6 ? times : undefined, delay: guide.motion.startsWith('rake') ? i * 0.04 : 0 }}>
            <rect x={pinX(i) - 6} y={84 - keyLens[i] - 26} width={12} height={26} rx={1.5} fill={C.driver} stroke="#5E6470" strokeWidth={0.6} />
            <path d={`M${pinX(i) - 6} ${84 - keyLens[i]}h12v${keyLens[i] - 3}l-6 4-6-4z`} fill={C.key} stroke="#B7791F" strokeWidth={0.6} />
          </motion.g>
        </g>
      ))}
      <line x1={30} x2={194} y1={52} y2={52} stroke={C.shear} strokeDasharray="4 3" />
      <motion.g animate={m} transition={{ ...repeat, times }} style={{ originX: '20px', originY: '92px' }}>
        <g transform="translate(-118 62) scale(0.9)">
          <path d={TIP[guide.profile] ?? TIP.other!} fill={C.tool} />
        </g>
      </motion.g>
      <path d="M22 104H44V96" fill="none" stroke={C.wrench} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <Caption>{guide.motion === 'yank' ? 'zasunout, lehce zabrat napínákem, škubnout ven' : guide.motion.startsWith('rake') ? 'rychle tam a zpět, napínák jen lehce' : 'pohyb nástroje'}</Caption>
    </svg>
  );
}
