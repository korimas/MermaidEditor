/**
 * Mermaid 图表预览组件
 * 实时渲染 Mermaid 图表并支持导出功能
 */
import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Copy, RefreshCw, ChevronDown, ZoomIn, ZoomOut, RotateCcw, Maximize2, Save } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface MermaidPreviewProps {
  code: string
  className?: string
}

export default function MermaidPreview({ code, className = '' }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [svgContent, setSvgContent] = useState<string>('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'monospace',
    })
  }, [])

  useEffect(() => {
    if (!code.trim()) {
      setSvgContent('')
      setError(null)
      return
    }

    // 防抖处理，减少频繁的渲染
    const timer = setTimeout(() => {
      renderMermaid()
    }, 500) // 500ms防抖延迟

    return () => clearTimeout(timer)
  }, [code])

  /**
   * 渲染 Mermaid 图表
   */
  const renderMermaid = async () => {
    if (!containerRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      // 清空容器
      containerRef.current.innerHTML = ''
      
      // 生成唯一ID
      const id = `mermaid-${Date.now()}`
      
      // 渲染图表
      const { svg } = await mermaid.render(id, code)
      
      // 将SVG插入容器
      containerRef.current.innerHTML = svg
      setSvgContent(svg)
    } catch (err) {
      setError(err instanceof Error ? err.message : '渲染失败')
      containerRef.current.innerHTML = ''
      setSvgContent('')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 下载SVG图片
   */
  const downloadSVG = () => {
    if (!svgContent) {
      toast.error('没有可下载的图表内容')
      return
    }

    try {
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mermaid-diagram-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('SVG文件下载成功')
    } catch (err) {
      console.error('下载失败:', err)
      toast.error('SVG下载失败，请重试')
    }
  }

  /**
   * 下载PNG图片
   */
  const downloadPNG = async () => {
    if (!svgContent) {
      toast.error('没有可下载的图表内容')
      return
    }

    const loadingToast = toast.loading('正在生成PNG图片...')

    try {
      // 获取SVG的实际显示尺寸
      const svgElement = containerRef.current?.querySelector('svg')
      if (!svgElement) {
        toast.error('找不到SVG元素', { id: loadingToast })
        return
      }

      // 获取SVG的边界框
      const bbox = svgElement.getBBox()
      const width = Math.max(bbox.width, 300)
      const height = Math.max(bbox.height, 200)

      // 创建Canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('无法创建Canvas上下文')
      }

      // 使用2倍分辨率提高清晰度
      const scale = 2
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)

      // 使用原始SVG内容，但确保包含正确的尺寸和viewBox
      let cleanSvg = svgContent
      
      // 确保SVG包含正确的viewBox
      if (!cleanSvg.includes('viewBox=')) {
        cleanSvg = cleanSvg.replace('<svg', `<svg viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"`)
      }
      
      // 确保SVG包含xmlns
      if (!cleanSvg.includes('xmlns=')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      }
      
      // 移除可能导致问题的外部引用
      cleanSvg = cleanSvg
        .replace(/xlink:href="[^"]*"/g, '')
        .replace(/href="[^"]*"/g, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

      // 使用Promise包装图片加载
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('图片加载超时'))
          }, 10000) // 10秒超时

          const img = new Image()
          img.onload = () => {
            clearTimeout(timeout)
            resolve(img)
          }
          img.onerror = (error) => {
            clearTimeout(timeout)
            console.error('图片加载错误:', error)
            reject(new Error('SVG图片加载失败'))
          }
          img.src = src
        })
      }

      // 创建data URL
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvg)
      console.log('尝试加载SVG:', dataUrl.substring(0, 100) + '...')
      
      try {
        // 加载图片
        const img = await loadImage(dataUrl)
        
        // 设置白色背景
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 启用图像平滑
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // 绘制SVG图像
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // 转换为PNG并下载
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = pngUrl
            link.download = `mermaid-diagram-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(pngUrl)
            toast.success('PNG图片下载成功', { id: loadingToast })
          } else {
            throw new Error('无法生成PNG文件')
          }
        }, 'image/png', 0.9)
      } catch (imageError) {
        console.error('PNG下载失败:', imageError)
        toast.error('PNG下载失败，改为下载SVG', { id: loadingToast })
        downloadSVG()
      }
    } catch (err) {
      console.error('PNG下载失败:', err)
      toast.error('PNG下载失败，改为下载SVG', { id: loadingToast })
      downloadSVG()
    }
  }

  /**
   * 复制PNG图片到剪切板
   */
  const copyToClipboard = async () => {
    if (!svgContent) {
      toast.error('没有可复制的图表内容')
      return
    }

    // 检查剪切板API是否可用
    if (!navigator.clipboard) {
      toast.error('当前浏览器不支持剪切板功能，请使用HTTPS或更新浏览器')
      return
    }

    // 检查浏览器是否支持图片复制
    if (!window.ClipboardItem) {
      toast.error('当前浏览器不支持图片复制功能')
      return
    }

    const loadingToast = toast.loading('正在复制PNG图片...')

    try {
      // 获取SVG的实际显示尺寸
      const svgElement = containerRef.current?.querySelector('svg')
      if (!svgElement) {
        toast.error('找不到SVG元素', { id: loadingToast })
        return
      }

      // 获取SVG的边界框
      const bbox = svgElement.getBBox()
      const width = Math.max(bbox.width, 300)
      const height = Math.max(bbox.height, 200)

      // 创建Canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        toast.error('无法创建Canvas上下文', { id: loadingToast })
        return
      }

      // 使用2倍分辨率提高清晰度
      const scale = 2
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)

      // 使用原始SVG内容，但确保包含正确的尺寸和viewBox
      let cleanSvg = svgContent
      
      // 确保SVG包含正确的viewBox
      if (!cleanSvg.includes('viewBox=')) {
        cleanSvg = cleanSvg.replace('<svg', `<svg viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"`)
      }
      
      // 确保SVG包含xmlns
      if (!cleanSvg.includes('xmlns=')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      }
      
      // 移除可能导致问题的外部引用
      cleanSvg = cleanSvg
        .replace(/xlink:href="[^"]*"/g, '')
        .replace(/href="[^"]*"/g, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

      // 创建图片并等待加载
      const img = new Image()
      
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('图片加载超时'))
        }, 10000) // 10秒超时

        img.onload = () => {
          clearTimeout(timeout)
          try {
            // 设置白色背景
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // 启用图像平滑
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            
            // 绘制SVG图像
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            
            resolve()
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }
        
        img.onerror = (error) => {
          clearTimeout(timeout)
          console.error('图片加载错误:', error)
          reject(new Error('SVG图片加载失败'))
        }
        
        // 设置图片源
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvg)
        console.log('尝试加载SVG:', dataUrl.substring(0, 100) + '...')
        img.src = dataUrl
      })

      // 等待图片加载完成
      await imageLoadPromise

      // 转换为PNG Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('无法生成PNG文件'))
          }
        }, 'image/png', 0.9)
      })

      // 复制PNG到剪切板
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      
      toast.success(`PNG图片已复制到剪切板 (${Math.round(width)}×${Math.round(height)})`, { id: loadingToast })

    } catch (error) {
      console.error('PNG复制失败:', error)
      toast.error('PNG复制失败，请重试或使用下载功能', { id: loadingToast })
    }
  }

  /**
   * 保存代码到Cookie
   */
  const saveToStorage = () => {
    if (!code.trim()) {
      toast.error('没有代码可以保存')
      return
    }
    
    if (!saveName.trim()) {
      toast.error('请输入保存名称')
      return
    }

    try {
      // 获取现有的保存项
      const existingSaves = JSON.parse(localStorage.getItem('mermaid-saves') || '[]')
      
      // 检查是否已存在同名项
      const existingIndex = existingSaves.findIndex((item: any) => item.name === saveName.trim())
      
      const saveItem = {
        name: saveName.trim(),
        code: code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      if (existingIndex >= 0) {
        // 更新现有项
        existingSaves[existingIndex] = {
          ...existingSaves[existingIndex],
          code: code,
          updatedAt: new Date().toISOString()
        }
        toast.success(`已更新保存项: ${saveName}`)
      } else {
        // 添加新项
        existingSaves.push(saveItem)
        toast.success(`已保存: ${saveName}`)
      }
      
      // 保存到localStorage（比cookie更适合存储较大数据）
      localStorage.setItem('mermaid-saves', JSON.stringify(existingSaves))
      
      // 触发自定义事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('mermaid-save-updated'))
      
      // 关闭对话框并清空输入
      setShowSaveDialog(false)
      setSaveName('')
      
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败，请重试')
    }
  }

  /**
   * 处理保存对话框的打开
   */
  const handleSaveClick = () => {
    if (!code.trim()) {
      toast.error('没有代码可以保存')
      return
    }
    
    // 生成默认名称
    const now = new Date()
    const defaultName = `图表_${now.getMonth() + 1}${now.getDate()}_${now.getHours()}${now.getMinutes()}`
    setSaveName(defaultName)
    setShowSaveDialog(true)
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />
      
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">预览</span>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={renderMermaid}
              disabled={isLoading || !code.trim()}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="重新渲染"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveClick}
              disabled={!code.trim()}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="保存代码"
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              disabled={!svgContent}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="复制PNG图片到剪切板"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!svgContent}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="下载"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border border-gray-200">
                <DropdownMenuItem onClick={downloadSVG} className="hover:bg-gray-50 text-xs">
                  下载 SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPNG} className="hover:bg-gray-50 text-xs">
                  下载 PNG (高质量)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-white overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          centerOnInit={false}
          centerZoomedOut={false}
          disablePadding={true}
          limitToBounds={false}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: false, mode: 'reset' }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              {/* 缩放控制工具栏 */}
              <div className="absolute top-2 right-2 z-10 flex flex-col bg-white border border-gray-200 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => zoomIn(0.5)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  disabled={!svgContent}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => zoomOut(0.5)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  disabled={!svgContent}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetTransform()}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  disabled={!svgContent}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => centerView()}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  disabled={!svgContent}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass="w-full h-full flex items-center justify-center"
              >
                <div className="w-full h-full relative">
                  {isLoading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex items-center space-x-2 text-gray-600 bg-white border border-gray-200 px-4 py-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm font-medium">正在渲染图表...</span>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-red-600 p-6 border border-red-200 bg-red-50 max-w-md">
                        <svg className="w-8 h-8 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium mb-1">渲染错误</p>
                        <p className="text-xs text-red-500">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  {!isLoading && !error && !svgContent && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500 bg-gray-50 p-8">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium mb-1">开始创建图表</p>
                        <p className="text-xs">请在左侧编辑器中输入 Mermaid 代码</p>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    ref={containerRef}
                    className="flex items-center justify-center min-h-full"
                  />
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* 保存对话框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>保存 Mermaid 图表</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="save-name">名称</Label>
              <Input
                id="save-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="请输入保存名称"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveToStorage()
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="text-sm"
              >
                取消
              </Button>
              <Button
                onClick={saveToStorage}
                disabled={!saveName.trim()}
                className="text-sm"
              >
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
