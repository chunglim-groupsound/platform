export default function RootLoading() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: '#151A26', zIndex: 9999,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2.5px solid #323E52',
        borderTopColor: '#D6A35A',
        animation: 'spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
