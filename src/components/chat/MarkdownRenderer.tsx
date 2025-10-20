import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks
        code({ inline, className, children }: any) {
          const match = /language-(\w+)/.exec(className || '')
          const codeString = String(children).replace(/\n$/, '')
          
          return !inline && match ? (
            <CodeBlock
              language={match[1]}
              code={codeString}
              inline={false}
            />
          ) : (
            <CodeBlock
              language="text"
              code={codeString}
              inline={true}
            />
          )
        },
        
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4 text-text dark:text-white">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-5 mb-3 text-text dark:text-white">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-4 mb-2 text-text dark:text-white">
            {children}
          </h3>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark underline"
          >
            {children}
          </a>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-3 text-text dark:text-gray-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-3 text-text dark:text-gray-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="ml-4">
            {children}
          </li>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 py-2 my-3 italic text-text-secondary dark:text-gray-400">
            {children}
          </blockquote>
        ),
        
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 dark:bg-gray-800">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
            {children}
          </tbody>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary dark:text-gray-400 uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-text dark:text-gray-300">
            {children}
          </td>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-3 text-text dark:text-gray-300 leading-relaxed">
            {children}
          </p>
        ),
        
        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-bold text-text dark:text-white">
            {children}
          </strong>
        ),
        
        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
