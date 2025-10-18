/**
 * TOOL: Simple Counter
 * DESCRIPTION: A simple counter app to demonstrate frontend tools
 * AUTHOR: ChimeraAI Team
 * VERSION: 1.0.0
 */

function CounterTool() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
        Counter Tool
      </h1>
      
      <div style={{ 
        fontSize: '4rem', 
        fontWeight: 'bold', 
        margin: '30px 0',
        color: '#007acc'
      }}>
        {count}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => setCount(count - 1)}
          style={{
            padding: '12px 24px',
            fontSize: '1.1rem',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          - Decrease
        </button>
        
        <button 
          onClick={() => setCount(0)}
          style={{
            padding: '12px 24px',
            fontSize: '1.1rem',
            background: '#888',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Reset
        </button>
        
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '12px 24px',
            fontSize: '1.1rem',
            background: '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Increase
        </button>
      </div>

      <p style={{ marginTop: '40px', color: '#666', fontSize: '0.9rem' }}>
        This is a simple frontend tool running in ChimeraAI
      </p>
    </div>
  );
}

// Export for rendering
const Component = CounterTool;
