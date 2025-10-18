import { Search, Filter, BarChart3, PanelLeftClose, PanelLeftOpen, X, FileText, Code2, Film, Wrench, Shield, Wifi, Database } from 'lucide-react'
import { useToolsStore } from '@/store/toolsStore'
import { cn } from '@/lib/utils'
import React from 'react'

const CATEGORIES = ['all', 'Office', 'DevTools', 'Multimedia', 'Utilities', 'Security', 'Network', 'Data']
const STATUSES = ['all', 'active', 'disabled']

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  Office: FileText,
  DevTools: Code2,
  Multimedia: Film,
  Utilities: Wrench,
  Security: Shield,
  Network: Wifi,
  Data: Database,
}

export default function ToolsSidePanel() {
  const {
    tools,
    searchQuery,
    selectedCategory,
    selectedStatus,
    sortBy,
    sidePanelMode,
    setSearchQuery,
    setSelectedCategory,
    setSelectedStatus,
    setSortBy,
    setSidePanelMode,
  } = useToolsStore()

  // Calculate statistics
  const totalTools = tools.length
  const activeTools = tools.filter(t => t.status === 'active').length
  const disabledTools = tools.filter(t => t.status === 'disabled').length

  const handleToggle = () => {
    if (sidePanelMode === 'full') {
      setSidePanelMode('minimized')
    } else if (sidePanelMode === 'minimized') {
      setSidePanelMode('hidden')
    } else {
      setSidePanelMode('full')
    }
  }

  // Hidden mode - floating toggle button
  if (sidePanelMode === 'hidden') {
    return (
      <button
        onClick={handleToggle}
        className="fixed left-4 top-24 z-50 p-3 glass-strong rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-all"
        title="Show side panel"
        data-testid="show-sidepanel"
      >
        <PanelLeftOpen className="w-5 h-5" />
      </button>
    )
  }

  // Minimized mode - icon-only vertical list
  if (sidePanelMode === 'minimized') {
    return (
      <div className="w-20 h-full glass-strong border-r border-gray-200 dark:border-dark-border flex flex-col items-center py-6 transition-all duration-300">
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className="mb-6 p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
          title="Hide side panel"
          data-testid="toggle-sidepanel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Category Icons */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'p-3 rounded-lg transition-all',
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
            )}
            title="All Categories"
            data-testid="category-icon-all"
          >
            <Filter className="w-5 h-5" />
          </button>
          {CATEGORIES.filter(c => c !== 'all').map((category) => {
            const Icon = CATEGORY_ICONS[category] || FileText
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'p-3 rounded-lg transition-all',
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover text-secondary'
                )}
                title={category}
                data-testid={`category-icon-${category}`}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </div>

        {/* Statistics Icon */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="p-3 glass rounded-lg text-center" title={`${totalTools} total tools`}>
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <span className="text-xs font-bold">{totalTools}</span>
          </div>
        </div>
      </div>
    )
  }

  // Full mode - complete panel
  return (
    <div className="w-80 h-full glass-strong border-r border-gray-200 dark:border-dark-border overflow-y-auto custom-scrollbar transition-all duration-300">
      <div className="p-6">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Filters</h3>
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface-hover rounded-lg transition-colors"
            title="Minimize side panel"
            data-testid="toggle-sidepanel"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

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
    </div>
  )
}
