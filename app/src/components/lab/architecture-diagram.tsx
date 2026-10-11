/**
 * Architecture diagram, built as inline SVG (not an image) so it stays crisp and
 * adapts to the theme via CSS variables. Shows the lab-to-cloud data flow.
 */
export function ArchitectureDiagram() {
  const box = {
    fill: "var(--surface-2)",
    stroke: "var(--border-strong)",
  };
  return (
    <svg
      viewBox="0 0 900 440"
      className="h-auto w-full"
      role="img"
      aria-label="Lookout architecture: Windows and Ubuntu VMs in UTM feed Wazuh; an export script sanitises alerts into Supabase, which the Vercel console reads, with Claude called server side."
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-2)" />
        </marker>
      </defs>

      {/* Lab boundary */}
      <rect
        x="10"
        y="40"
        width="430"
        height="360"
        rx="10"
        fill="none"
        stroke="var(--border)"
        strokeDasharray="4 4"
      />
      <text x="26" y="64" fill="var(--muted)" fontSize="13" fontWeight="600">
        Lab · MacBook Air M2 · UTM (host-only network)
      </text>

      {/* Windows VM */}
      <rect x="34" y="88" width="180" height="120" rx="8" fill={box.fill} stroke={box.stroke} />
      <text x="48" y="112" fill="var(--foreground)" fontSize="13" fontWeight="600">
        Windows 11 ARM
      </text>
      <text x="48" y="134" fill="var(--muted)" fontSize="11">
        Sysmon
      </text>
      <text x="48" y="152" fill="var(--muted)" fontSize="11">
        Wazuh agent
      </text>
      <text x="48" y="170" fill="var(--muted)" fontSize="11">
        Atomic Red Team
      </text>
      <text x="48" y="192" fill="var(--muted-2)" fontSize="10" fontFamily="var(--font-mono)">
        win11-lab
      </text>

      {/* Ubuntu VM */}
      <rect x="236" y="88" width="184" height="120" rx="8" fill={box.fill} stroke={box.stroke} />
      <text x="250" y="112" fill="var(--foreground)" fontSize="13" fontWeight="600">
        Ubuntu 22.04
      </text>
      <text x="250" y="134" fill="var(--muted)" fontSize="11">
        Wazuh manager
      </text>
      <text x="250" y="152" fill="var(--muted)" fontSize="11">
        Wazuh indexer
      </text>
      <text x="250" y="170" fill="var(--muted)" fontSize="11">
        Wazuh dashboard
      </text>
      <text x="250" y="192" fill="var(--muted-2)" fontSize="10" fontFamily="var(--font-mono)">
        192.168.64.5
      </text>

      {/* agent arrow */}
      <path
        d="M214 148 L236 148"
        stroke="var(--muted-2)"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
        fill="none"
      />
      <text x="208" y="140" fill="var(--muted-2)" fontSize="9" fontFamily="var(--font-mono)">
        1514/1515
      </text>

      {/* export */}
      <rect x="130" y="256" width="200" height="96" rx="8" fill={box.fill} stroke={box.stroke} />
      <text x="146" y="280" fill="var(--foreground)" fontSize="13" fontWeight="600">
        Export script
      </text>
      <text x="146" y="302" fill="var(--muted)" fontSize="11">
        pull → parse → sanitise
      </text>
      <text x="146" y="320" fill="var(--muted)" fontSize="11">
        hosts, users, IPs → placeholders
      </text>
      <text x="146" y="340" fill="var(--muted-2)" fontSize="10" fontFamily="var(--font-mono)">
        on the Mac only
      </text>

      {/* indexer -> export */}
      <path
        d="M328 208 L300 256"
        stroke="var(--muted-2)"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
        fill="none"
      />
      <text x="336" y="236" fill="var(--muted-2)" fontSize="9" fontFamily="var(--font-mono)">
        indexer API
      </text>

      {/* Cloud boundary */}
      <rect
        x="470"
        y="40"
        width="420"
        height="360"
        rx="10"
        fill="none"
        stroke="var(--border)"
        strokeDasharray="4 4"
      />
      <text x="486" y="64" fill="var(--muted)" fontSize="13" fontWeight="600">
        Cloud · always on
      </text>

      {/* Supabase */}
      <rect x="500" y="100" width="170" height="86" rx="8" fill={box.fill} stroke={box.stroke} />
      <text x="514" y="126" fill="var(--foreground)" fontSize="13" fontWeight="600">
        Supabase
      </text>
      <text x="514" y="148" fill="var(--muted)" fontSize="11">
        Postgres
      </text>
      <text x="514" y="166" fill="var(--muted)" fontSize="11">
        row-level security
      </text>

      {/* Vercel console */}
      <rect x="500" y="228" width="170" height="86" rx="8" fill={box.fill} stroke={box.stroke} />
      <text x="514" y="254" fill="var(--foreground)" fontSize="13" fontWeight="600">
        Vercel
      </text>
      <text x="514" y="276" fill="var(--muted)" fontSize="11">
        Next.js console
      </text>
      <text x="514" y="294" fill="var(--muted)" fontSize="11">
        public demo + analyst
      </text>

      {/* Anthropic */}
      <rect x="712" y="228" width="150" height="86" rx="8" fill={box.fill} stroke="var(--accent)" />
      <text x="726" y="254" fill="var(--foreground)" fontSize="13" fontWeight="600">
        Claude
      </text>
      <text x="726" y="276" fill="var(--muted)" fontSize="11">
        triage assist
      </text>
      <text x="726" y="294" fill="var(--muted)" fontSize="11">
        server side only
      </text>

      {/* export -> supabase */}
      <path
        d="M330 300 C 420 300, 440 143, 500 143"
        stroke="var(--muted-2)"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
        fill="none"
      />
      <text x="396" y="210" fill="var(--muted-2)" fontSize="9" fontFamily="var(--font-mono)">
        import
      </text>

      {/* supabase <-> vercel */}
      <path
        d="M585 186 L585 228"
        stroke="var(--muted-2)"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
        markerStart="url(#arrow)"
        fill="none"
      />

      {/* vercel -> claude */}
      <path
        d="M670 271 L712 271"
        stroke="var(--accent)"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
        fill="none"
      />

      {/* viewers */}
      <text x="585" y="360" fill="var(--muted-2)" fontSize="10" textAnchor="middle">
        recruiters · me
      </text>
      <path
        d="M585 338 L585 346"
        stroke="var(--muted-2)"
        strokeWidth="1.5"
        markerStart="url(#arrow)"
        fill="none"
      />
    </svg>
  );
}
