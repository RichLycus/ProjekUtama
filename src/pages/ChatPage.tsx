export default function ChatPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-display font-bold text-text mb-6">
        AI Chat
      </h1>
      <div className="card">
        <p className="text-text-secondary mb-4">
          Chat with AI models powered by Ollama.
        </p>
        <div className="mt-4 text-sm text-text-muted">
          <span className="bg-secondary/20 text-secondary px-2 py-1 rounded">Coming in Phase 3</span>
        </div>
      </div>
    </div>
  )
}