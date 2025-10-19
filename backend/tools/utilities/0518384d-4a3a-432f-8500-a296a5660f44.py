// src/pages/CalculatorPage.tsx
import { useState } from 'react';

export default function CalculatorPage() {
  const [expression, setExpression] = useState<string>('');
  const [precision, setPrecision] = useState<number>(10);
  const [result, setResult] = useState<{ value: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expression.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, precision }),
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setResult({ value: String(data.result), isError: false });
      } else {
        setResult({ value: data.detail || data.message || 'Unknown error', isError: true });
      }
    } catch (err) {
      setResult({ value: 'Failed to connect to calculator service', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-display font-bold text-text mb-6">
        Advanced Calculator
      </h1>
      <div className="card bg-surface p-6 rounded-xl shadow-sm border border-border">
        <p className="text-text-secondary mb-6">
          Evaluate mathematical expressions with support for trigonometry, logarithms, and constants like <code className="bg-muted px-1 rounded">pi</code> and <code className="bg-muted px-1 rounded">e</code>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expression" className="block text-sm font-medium text-text mb-1">
              Expression
            </label>
            <input
              id="expression"
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g., sqrt(16) + sin(pi/2)"
              className="w-full px-4 py-2 bg-input-bg text-text border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="precision" className="block text-sm font-medium text-text mb-1">
              Precision (decimal places)
            </label>
            <input
              id="precision"
              type="number"
              min="0"
              max="15"
              value={precision}
              onChange={(e) => setPrecision(Math.max(0, Math.min(15, Number(e.target.value))))}
              className="w-full px-4 py-2 bg-input-bg text-text border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={!expression.trim() || loading}
            className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              result.isError
                ? 'bg-error/10 border-error text-error'
                : 'bg-success/10 border-success text-success'
            }`}
          >
            <p className="font-mono text-lg">{result.value}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-text-muted">
          <p className="mb-2">
            <strong>Supported:</strong> <code className="bg-muted px-1 rounded">+, -, *, /, **, %</code>, functions like{' '}
            <code className="bg-muted px-1 rounded">sin, cos, log, sqrt</code>, and constants{' '}
            <code className="bg-muted px-1 rounded">pi, e</code>.
          </p>
          <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs">
            Powered by FastAPI backend
          </span>
        </div>
      </div>
    </div>
  );
}