export default function SearchBar({ value, onChange, placeholder = "Search Kenyan movies..." }) {
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.6,
        }}
      >
        🔍
      </span>
      <input
        className="clay-input"
        style={{ paddingLeft: 42 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
