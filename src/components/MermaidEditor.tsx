/**
 * Mermaid 代码编辑器组件
 * 提供语法高亮和实时编辑功能
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface MermaidEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function MermaidEditor({ value, onChange, className = '' }: MermaidEditorProps) {
  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  /**
   * 防抖处理onChange事件，减少频繁的父组件更新
   */
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300) // 300ms防抖延迟
  }, [onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }, [debouncedOnChange])

  /**
   * 优化滚动同步处理，使用requestAnimationFrame
   */
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      requestAnimationFrame(() => {
        if (textareaRef.current && lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
        }
      })
    }
  }, [])

  /**
   * 使用useMemo缓存行号计算，只在内容变化时重新计算
   */
  const lineNumbers = useMemo(() => {
    const lineCount = localValue.split('\n').length
    return Array.from({ length: lineCount }, (_, i) => i + 1)
  }, [localValue])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Mermaid 代码编辑器</span>
        </div>
      </div>
      
      <div className="flex-1 flex bg-white overflow-hidden">
        {/* 行号区域 */}
        <div 
          ref={lineNumbersRef}
          className="flex-shrink-0 w-12 bg-gray-50 border-r border-gray-200 overflow-y-hidden"
        >
          <div className="py-3 px-2">
            {lineNumbers.map((lineNum) => (
              <div 
                key={lineNum} 
                className="text-xs text-gray-400 text-right leading-6 font-mono"
              >
                {lineNum}
              </div>
            ))}
          </div>
        </div>
        
        {/* 代码编辑区域 */}
        <div className="flex-1 relative overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            onScroll={handleScroll}
            placeholder="在这里输入您的 Mermaid 代码..."
            className="w-full h-full resize-none font-mono text-sm bg-transparent text-gray-800 border-none focus:ring-0 focus:outline-none placeholder-gray-400 leading-6 p-3 overflow-y-auto rounded-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
