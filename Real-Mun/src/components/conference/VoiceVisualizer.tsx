const BAR_COUNT = 36;

export default function VoiceVisualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-2"
      style={{ background: "var(--color-surface)" }}>
      <div
        className="voice-waveform flex flex-1 items-center justify-center gap-[3px] h-9"
        data-active={active}
        role="img"
        aria-label={active ? "Microphone active, voice waveform" : "Microphone inactive"}
      >
        {Array.from({ length: BAR_COUNT }, (_, index) => {
          const centerDistance = Math.abs(index - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
          const height = 8 + Math.round((1 - centerDistance) * (8 + ((index * 13) % 15)));
          return (
            <span
              key={index}
              className="voice-wave-bar"
              style={{
                height: `${height}px`,
                animationDelay: `${-((index * 83) % 900)}ms`,
              }}
            />
          );
        })}
      </div>
      <span className="text-[11px] font-mono uppercase tracking-wider whitespace-nowrap"
        style={{ color: active ? "var(--color-accent)" : "var(--color-muted)" }}>
        {active ? "Listening" : "Voice visualizer"}
      </span>
    </div>
  );
}
