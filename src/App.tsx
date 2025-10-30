import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import HomePage from './pages/HomePage'
import PortfolioPage from './pages/PortfolioPage'
import ToolsPage from './pages/ToolsPage'
import ToolExecutionPage from './pages/ToolExecutionPage'
import ToolsGuidePage from './pages/ToolsGuidePage'
import ToolLogsPage from './pages/ToolLogsPage'
import ToolEditorPage from './pages/ToolEditorPage'
import ChatPage from './pages/ChatPage'
import GamesPage from './pages/GamesPage'
import SettingsPage from './pages/SettingsPage'
import RAGStudioPage from './pages/RAGStudioPage'
import RAGStudioEditorPage from './pages/RAGStudioEditorPage'
import FlowConfigEditorPage from './pages/FlowConfigEditorPage'
import { initializeDependencyBridge } from './lib/dependencyBridge'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/portfolio" element={<PageTransition><PortfolioPage /></PageTransition>} />
        <Route path="/tools" element={<PageTransition><ToolsPage /></PageTransition>} />
        <Route path="/tools/:toolId" element={<ToolExecutionPage />} />
        <Route path="/tools/logs/:toolId" element={<ToolLogsPage />} />
        <Route path="/tools/edit/:toolId" element={<ToolEditorPage />} />
        <Route path="/tools-guide" element={<PageTransition><ToolsGuidePage /></PageTransition>} />
        <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
        <Route path="/games" element={<PageTransition><GamesPage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/rag-studio" element={<PageTransition><RAGStudioPage /></PageTransition>} />
        <Route path="/rag-studio/editor/:mode" element={<RAGStudioEditorPage />} />
        <Route path="/rag-studio/flow-editor/:mode" element={<FlowConfigEditorPage />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  // Initialize dependency bridge for dynamic tool loading
  useEffect(() => {
    initializeDependencyBridge()
  }, [])

  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  )
}

export default App