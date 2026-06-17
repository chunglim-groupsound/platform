export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      {/* radial gradient blobs */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      {/* hairline grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}
