import { Database, Search, Layers } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface RAGConfigProps {
  config: {
    retriever_type?: string
    collection_name?: string
    top_k?: number
    similarity_threshold?: number
    description?: string
  }
  onChange: (config: any) => void
}

const RETRIEVER_TYPES = [
  { value: 'semantic', label: 'Semantic Search', description: 'Vector similarity search' },
  { value: 'keyword', label: 'Keyword Search', description: 'BM25 keyword matching' },
  { value: 'hybrid', label: 'Hybrid Search', description: 'Combine semantic + keyword' }
]

export default function RAGConfig({ config, onChange }: RAGConfigProps) {
  const retrieverType = config.retriever_type || 'semantic'
  const collectionName = config.collection_name || 'default_collection'
  const topK = config.top_k ?? 5
  const similarityThreshold = config.similarity_threshold ?? 0.7
  const description = config.description || 'RAG retrieval node'

  const handleRetrieverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...config, retriever_type: e.target.value })
  }

  const handleCollectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, collection_name: e.target.value })
  }

  const handleTopKChange = (value: number[]) => {
    onChange({ ...config, top_k: value[0] })
  }

  const handleThresholdChange = (value: number[]) => {
    onChange({ ...config, similarity_threshold: value[0] })
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, description: e.target.value })
  }

  return (
    <div className="space-y-6">
      {/* Retriever Type */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Search className="w-4 h-4 text-green-600 dark:text-green-400" />
          Retriever Type
        </label>
        <select
          value={retrieverType}
          onChange={handleRetrieverChange}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
        >
          {RETRIEVER_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Choose how to retrieve relevant documents
        </p>
      </div>

      {/* Collection Name */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Database className="w-4 h-4 text-green-600 dark:text-green-400" />
          Collection Name
        </label>
        <input
          type="text"
          value={collectionName}
          onChange={handleCollectionChange}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
          placeholder="Enter collection name"
        />
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Name of the vector database collection to search
        </p>
      </div>

      {/* Top K Slider */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
            Top K Results: {topK}
          </span>
        </label>
        <Slider
          value={[topK]}
          onValueChange={handleTopKChange}
          min={1}
          max={20}
          step={1}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>1 - Few</span>
          <span>10 - Medium</span>
          <span>20 - Many</span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Number of most relevant documents to retrieve
        </p>
      </div>

      {/* Similarity Threshold Slider */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span>Similarity Threshold: {similarityThreshold.toFixed(2)}</span>
        </label>
        <Slider
          value={[similarityThreshold]}
          onValueChange={handleThresholdChange}
          min={0}
          max={1}
          step={0.05}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0.0 - Loose</span>
          <span>0.5 - Balanced</span>
          <span>1.0 - Strict</span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Minimum similarity score to include a document
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary focus:border-transparent
            transition-colors
          "
          placeholder="Enter node description"
        />
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Optional: Describe what this RAG node does
        </p>
      </div>
    </div>
  )
}
