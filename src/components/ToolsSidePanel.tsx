import { Search, Filter, BarChart3 } from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import { cn } from '@/lib/utils'

const CATEGORIES = ['all', 'Office', 'DevTools', 'Multimedia', 'Utilities', 'Security', 'Network', 'Data']
const STATUSES = ['all', 'active', 'disabled']

export default function ToolsSidePanel() {
  const {
    tools,
    searchQuery,
    selectedCategory,
    selectedStatus,
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setSelectedStatus,
    setSortBy,
  } = useToolsStore()

  // Calculate statistics
  const totalTools = tools.length
  const activeTools = tools.filter(t => t.status === 'active').length
  const disabledTools = tools.filter(t => t.status === 'disabled').length

  return (
    <div className="w-80 h-full glass-strong border-r border-gray-200 dark:border-dark-border p-6 overflow-y-auto custom-scrollbar">
      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-secondary">
          <Search className="w-4 h-4 inline mr-2" />
          Search Tools
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name..."
          className="input text-sm"
          data-testid="tools-search"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-secondary">
          <Filter className="w-4 h-4 inline mr-2" />
          Categories
        </label>
        <div className="space-y-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                selectedCategory === category
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
              )}
              data-testid={`category-${category}`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-secondary">
          Status
        </label>
        <div className="space-y-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-all capitalize',
                selectedStatus === status
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
              )}
              data-testid={`status-${status}`}
            >
              {status === 'all' ? 'All Status' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-secondary">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="input text-sm"
          data-testid="sort-select"
        >
          <option value="name">Name (A-Z)</option>
          <option value="date">Date Added</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="glass rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 text-secondary flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Statistics
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">Total Tools:</span>
            <span className="font-semibold">{totalTools}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Active:</span>
            <span className="font-semibold text-green-500">{activeTools}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Disabled:</span>
            <span className="font-semibold text-red-500">{disabledTools}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
