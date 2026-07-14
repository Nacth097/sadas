export const StatusPill = ({ value }) => {
  const label = String(value || 'pending');
  return <span className={`status-pill status-${label}`}>{label}</span>;
};
