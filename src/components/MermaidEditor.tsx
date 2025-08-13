/**
 * Mermaid 代码编辑器组件
 * 使用react-syntax-highlighter提供专业的语法高亮
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Code, RefreshCw, FileText } from 'lucide-react'

interface MermaidEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  onUpdate?: () => void
  showUpdate?: boolean
  activeTitle?: string
  activeFolder?: string
}

export default function MermaidEditor({ value, onChange, className = '', onUpdate, showUpdate = false, activeTitle, activeFolder }: MermaidEditorProps) {
  const [localValue, setLocalValue] = useState(value)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const copyTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // 根据窗口宽度自适应截断策略
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /**
   * 防抖处理onChange事件
   */
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300)
  }, [onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }, [debouncedOnChange])

  /**
   * 同步滚动处理
   */
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      const scrollTop = textareaRef.current.scrollTop
      const scrollLeft = textareaRef.current.scrollLeft
      
      requestAnimationFrame(() => {
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = scrollTop
        }
        if (highlightRef.current) {
          highlightRef.current.scrollTop = scrollTop
          highlightRef.current.scrollLeft = scrollLeft
        }
      })
    }
  }, [])



  /**
   * 计算行号 - 使用memoization优化性能
   */
  const lineCount = localValue.split('\n').length
  const lineNumbers = useMemo(() => 
    Array.from({ length: lineCount }, (_, i) => i + 1), 
    [lineCount]
  )

  /**
   * 自定义样式覆盖
   */
  const customStyle = {
    margin: 0,
    padding: '12px',
    background: 'transparent',
    fontSize: '14px',
    lineHeight: '21px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    overflow: 'visible',
    whiteSpace: 'pre' as const,
    wordBreak: 'normal' as const,
    overflowWrap: 'normal' as const,
  }

  // 中间截断：保留前后片段，适合很长名称/路径
  const truncateMiddle = useCallback((text: string, maxChars: number) => {
    if (!text) return ''
    if (text.length <= maxChars) return text
    const side = Math.max(2, Math.floor((maxChars - 1) / 2))
    return `${text.slice(0, side)}…${text.slice(-side)}`
  }, [])

  const titleMax = windowWidth < 480 ? 16 : windowWidth < 768 ? 24 : 36
  const folderMax = windowWidth < 480 ? 14 : windowWidth < 768 ? 22 : 32
  const displayTitle = truncateMiddle(activeTitle || '', titleMax)
  const displayFolder = truncateMiddle(activeFolder || '', folderMax)

  /**
   * 复制代码到剪贴板
   */
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(localValue)
      setCopied(true)
      
      // 3秒后恢复图标
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
      }, 3000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }, [localValue])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800 tracking-wide">编辑器</span>
          </div>
          <div className="flex-1 flex items-center justify-center px-2 min-w-0">
            {showUpdate && activeTitle && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 shadow-sm max-w-[70vw] md:max-w-[50vw] min-w-0">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs font-medium truncate" title={activeTitle}>{displayTitle}</span>
                {activeFolder ? (
                  <span className="text-[11px] text-blue-500/80 truncate hidden sm:inline" title={activeFolder}>（{displayFolder}）</span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showUpdate && onUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUpdate}
                className="h-7 px-2 text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                title="更新到我的保存"
              >
                <RefreshCw className="w-3 h-3 text-blue-600" />
                更新
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 px-2 text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-gray-500" />
              )}
              复制
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex bg-white overflow-hidden">
        {/* 行号区域 */}
        <div 
          ref={lineNumbersRef}
          className="line-numbers flex-shrink-0 w-12 bg-gray-50 overflow-hidden"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div style={{ padding: '12px 8px' }}>
            {lineNumbers.map((lineNum) => (
              <div 
                key={lineNum} 
                className="text-xs text-gray-500 text-right font-mono"
                style={{ 
                  height: '21px',
                  lineHeight: '21px',
                  fontSize: '14px'
                }}
              >
                {lineNum}
              </div>
            ))}
          </div>
        </div>
        
        {/* 代码编辑区域 */}
        <div className="flex-1 relative">
          {/* 语法高亮层 */}
          <div 
            ref={highlightRef}
            className="syntax-highlight-layer absolute inset-0 overflow-hidden pointer-events-none z-0"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <SyntaxHighlighter
              language="javascript"
              style={tomorrow}
              customStyle={customStyle}
              showLineNumbers={false}
              wrapLines={false}
              lineProps={{ style: { display: 'block', height: '21px', lineHeight: '21px', whiteSpace: 'pre' } }}
            >
              {localValue || ' '}
            </SyntaxHighlighter>
          </div>
          
          {/* 透明的文本输入框 */}
          <Textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            onScroll={handleScroll}
            placeholder="在这里输入您的 Mermaid 代码..."
            className="editor-textarea w-full h-full resize-none font-mono bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400 relative z-10"
            style={{ 
              color: localValue ? 'transparent' : '#9ca3af',
              caretColor: '#374151',
              padding: '12px',
              fontSize: '14px',
              lineHeight: '21px',
              overflow: 'auto',
              whiteSpace: 'pre',
              wordWrap: 'normal',
              overflowWrap: 'normal',
              border: 'none',
              boxShadow: 'none'
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
