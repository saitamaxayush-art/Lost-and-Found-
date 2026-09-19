export default function StatusBadge({ status }) {
  const cls = status.toLowerCase();
  return <span className={`status-badge ${cls}`}>{status}</span>;
}
