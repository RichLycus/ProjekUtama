import React, { useState } from 'react';
import { Volume2, User, Users } from 'lucide-react';

export default function VoicePreview() {
  const [text, setText] = useState('Halo, selamat datang di sistem akademik.');
  const [voice, setVoice] = useState('female');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: 'Voice Preview',
          params: { text, voice }
        })
      });
      const data = await response.json();
      setResult(data.success ? data.data : `Error: ${data.data}`);
    } catch (err) {
      setResult('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Volume2 className="text-indigo-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Voice Preview</h1>
      </div>

      <p className="text-gray-600 mb-6">
        Preview how your announcement will sound using simulated voice output.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text to Speak
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Enter your message..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setVoice('female')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                voice === 'female'
                  ? 'bg-purple-100 border-purple-500 text-purple-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User size={16} />
              Female
            </button>
            <button
              type="button"
              onClick={() => setVoice('male')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                voice === 'male'
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={16} />
              Male
            </button>
          </div>
        </div>

        <button
          onClick={handlePreview}
          disabled={loading || !text.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? 'Processing...' : '▶ Preview Voice'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
            <p className="font-medium text-gray-800">Output:</p>
            <p className="mt-2 text-gray-700 break-words">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
