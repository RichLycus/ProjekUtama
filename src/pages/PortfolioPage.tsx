export default function PortfolioPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-display font-bold text-text mb-6">
        Portfolio
      </h1>
      <div className="card">
        <p className="text-text-secondary">
          Your portfolio and projects will be displayed here.
        </p>
        <div className="mt-4 text-sm text-text-muted">
          <span className="bg-accent/20 text-accent px-2 py-1 rounded">Coming in Phase 1+</span>
        </div>
      </div>
    </div>
  )
}