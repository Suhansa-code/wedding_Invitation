export default function AdminLoading() {
  return (
    <div className="admin-main studio-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="loading-ornament" aria-hidden="true" />
      <p className="muted">Preparing your invitation studio...</p>
    </div>
  );
}
