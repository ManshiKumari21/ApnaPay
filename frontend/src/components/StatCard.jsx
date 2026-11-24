
export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  subtitle
}) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon">
          {Icon && <Icon size={19} />}
        </div>
      </div>

      <h2>{value ?? 0}</h2>

      {subtitle && (
        <small>{subtitle}</small>
      )}
    </div>
  );
}
