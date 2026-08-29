export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {stars.map((n) => {
        const filled = n <= Math.round(value);
        return (
          <span
            key={n}
            onClick={() => !readOnly && onChange && onChange(n)}
            role={readOnly ? undefined : "button"}
            aria-label={`${n} star`}
            style={{
              fontSize: size,
              cursor: readOnly ? "default" : "pointer",
              color: filled ? "var(--ke-gold)" : "rgba(255,255,255,0.25)",
              transition: "transform 0.1s ease, color 0.15s ease",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (!readOnly) e.currentTarget.style.transform = "scale(1.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
