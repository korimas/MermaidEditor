/**
 * Mermaid 预览组件
 * 渲染Mermaid图表的预览
 */
import { useEffect, useRef, useState, useCallback } from 'react'
declare const mermaid: any
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Copy, Download, Check, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import '../styles/preview.css'

interface MermaidPreviewProps {
  code: string
  className?: string
}

export default function MermaidPreview({ code, className = '' }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastCode, setLastCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [renderKey, setRenderKey] = useState(0)
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 将SVG转换为PNG
   */
  const svgToPng = useCallback((svgElement: SVGElement, scale: number = 2): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'))
          return
        }

        // 获取SVG的实际尺寸
        const svgRect = svgElement.getBoundingClientRect()
        const svgWidth = svgRect.width || 800
        const svgHeight = svgRect.height || 600

        // 克隆SVG并准备数据
        const clonedSvg = svgElement.cloneNode(true) as SVGElement
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
        clonedSvg.setAttribute('width', svgWidth.toString())
        clonedSvg.setAttribute('height', svgHeight.toString())
        
        // 确保SVG有正确的viewBox
        if (!clonedSvg.getAttribute('viewBox')) {
          clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
        }

        // 获取SVG的HTML字符串并清理
        let svgData = new XMLSerializer().serializeToString(clonedSvg)
        
        // 修复可能的编码问题
        svgData = svgData.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        
        // 使用更安全的编码方式
        let svgDataUrl: string
        try {
          // 尝试使用encodeURIComponent
          svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`
        } catch (encodeError) {
          // 降级到base64编码
          console.warn('encodeURIComponent失败，使用base64编码:', encodeError)
          try {
            const svgBase64 = btoa(unescape(encodeURIComponent(svgData)))
            svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`
          } catch (base64Error) {
            console.error('base64编码也失败:', base64Error)
            reject(new Error('SVG数据编码失败'))
            return
          }
        }

        const img = new Image()
        
        // 设置超时机制
        const timeout = setTimeout(() => {
          reject(new Error('图片加载超时'))
        }, 10000) // 10秒超时

        img.onload = () => {
          clearTimeout(timeout)
          try {
            // 设置Canvas尺寸
            canvas.width = svgWidth * scale
            canvas.height = svgHeight * scale

            // 设置白色背景
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // 绘制SVG图片
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            // 转换为PNG
            const pngDataUrl = canvas.toDataURL('image/png', 1.0)
            resolve(pngDataUrl)
          } catch (error) {
            console.error('Canvas绘制失败:', error)
            reject(new Error('Canvas绘制失败'))
          }
        }

        img.onerror = (error) => {
          clearTimeout(timeout)
          console.error('图片加载失败:', error)
          console.error('SVG数据URL长度:', svgDataUrl.length)
          console.error('SVG数据前100字符:', svgDataUrl.substring(0, 100))
          reject(new Error('图片加载失败'))
        }

        // 设置图片源
        img.src = svgDataUrl

      } catch (error) {
        console.error('SVG转PNG初始化失败:', error)
        reject(new Error('SVG转PNG初始化失败'))
      }
    })
  }, [])

  /**
   * 复制PNG到剪贴板
   */
  const handleCopyPng = useCallback(async () => {
    const svgElement = containerRef.current?.querySelector('svg')
    if (!svgElement) {
      toast.error('未找到图表')
      return
    }

    try {
      const pngUrl = await svgToPng(svgElement)

      // 验证生成的PNG数据
      if (!pngUrl.startsWith('data:image/png')) {
        throw new Error('PNG生成失败')
      }

      const response = await fetch(pngUrl)
      const blob = await response.blob()

      if (blob.type !== 'image/png') {
        throw new Error('PNG格式错误')
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])

      // 显示成功状态 - 设置图标为绿色✓
      setCopied(true)
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
      }, 3000)

    } catch (error) {
      console.error('复制PNG失败:', error)

      // 降级方案：复制SVG字符串
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        await navigator.clipboard.writeText(svgData)

        // 显示成功状态 - 设置图标为绿色✓
        setCopied(true)
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current)
        }
        copyTimerRef.current = setTimeout(() => {
          setCopied(false)
        }, 3000)

      } catch (fallbackError) {
        console.error('复制失败:', fallbackError)
      }
    }
  }, [svgToPng])

  /**
   * 导出PNG
   */
  const handleExportPng = useCallback(async () => {
    const svgElement = containerRef.current?.querySelector('svg')
    if (!svgElement) {
      toast.error('未找到图表')
      return
    }

    try {
      const pngUrl = await svgToPng(svgElement)

      // 验证生成的PNG数据
      if (!pngUrl.startsWith('data:image/png')) {
        throw new Error('PNG生成失败')
      }

      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = 'mermaid-diagram.png'
      downloadLink.click()
    } catch (error) {
      console.error('导出PNG失败:', error)
      toast.error('PNG导出失败，正在切换为SVG格式...', { id: 'png-export' })

      // 降级方案：导出SVG
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        const downloadLink = document.createElement('a')
        downloadLink.href = svgUrl
        downloadLink.download = 'mermaid-diagram.svg'
        downloadLink.click()
        URL.revokeObjectURL(svgUrl)
      } catch (fallbackError) {
        console.error('导出失败:', fallbackError)
        toast.error('导出失败，请重试', { id: 'png-export' })
      }
    }
  }, [svgToPng])

  /**
   * 强制重新渲染
   */
  const handleForceRefresh = useCallback(() => {
    // 清理所有可能的mermaid错误元素
    const errorElements = document.querySelectorAll('[id*="mermaid"], [id*="dmermaid"], .mermaid-error, .error-icon')
    errorElements.forEach(el => {
      if (el.parentNode && !containerRef.current?.contains(el)) {
        el.remove()
      }
    })
    
    setError(null)
    setLastCode('')  // 清空lastCode确保重新渲染
    setRenderKey(prev => prev + 1)  // 强制更新renderKey
  }, [])

  useEffect(() => {
    // 清理页面中可能存在的mermaid错误元素
    const cleanupMermaidElements = () => {
      const errorElements = document.querySelectorAll('[id*="mermaid"], [id*="dmermaid"], .mermaid-error, .error-icon')
      errorElements.forEach(el => {
        if (el.parentNode && !containerRef.current?.contains(el)) {
          el.remove()
        }
      })
    }
    
    cleanupMermaidElements()
    
    try {
      // 完整的Mermaid初始化配置
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        deterministicIds: false,
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 16,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: false,
          mirrorActors: true,
          rightAngles: false,
          showSequenceNumbers: false
        },
        gantt: {
          useMaxWidth: false,
          // fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 14,
          // fontWeight: 'normal',
          gridLineStartPadding: 350,
          leftPadding: 40,
          rightPadding: 40,
          topPadding: 50,
          // bottomPadding: 50
        },
        state: {
          useMaxWidth: false,
          // stateFillColor: '#f9f9f9',
          // startStateFillColor: '#0f0f0f',
          // endStateFillColor: '#0f0f0f',
          // stateStrokeColor: '#333',
          // activeStateFillColor: '#e6e6e6',
          // activeStateStrokeColor: '#333'
        },
        class: {
          useMaxWidth: false,
          // fontFamily: 'Arial, Helvetica, sans-serif',
          // fontSize: 14,
          // fontWeight: 'normal'
        },
        // classDiagram: {
        //   useMaxWidth: false,
        //   fontFamily: 'Arial, Helvetica, sans-serif',
        //   fontSize: 14,
        //   fontWeight: 'normal'
        // },
        pie: {
          useMaxWidth: false,
          // fontFamily: 'Arial, Helvetica, sans-serif',
          // fontSize: 14,
          // fontWeight: 'normal'
        },
        mindmap: {
          useMaxWidth: false,
          // fontFamily: 'Arial, Helvetica, sans-serif',
          // fontSize: 14,
          // fontWeight: 'normal'
        },
        packet: {
          useMaxWidth: false,
        }
      })
    } catch (error) {
      console.error('Mermaid初始化失败:', error)
      setError('Mermaid初始化失败')
    }

    // 重置状态
    setError(null)
    setIsLoading(false)
    setLastCode('')
  }, [])

  // 清理定时器和DOM元素
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
      
      // 组件卸载时清理所有可能的mermaid错误元素
      const errorElements = document.querySelectorAll('[id*="mermaid"], [id*="dmermaid"], .mermaid-error, .error-icon')
      errorElements.forEach(el => {
        if (el.parentNode && !containerRef.current?.contains(el)) {
          el.remove()
        }
      })
    }
  }, [])

  useEffect(() => {
    console.log("update")
    // console.log("code:", code)
    // console.log("lastCode:",lastCode)

    if(!code) return
    if(code === lastCode) return

    if (error) {
      setError(null)
    }

    // 容器未挂载时，等待下一次effect再渲染
    if (!containerRef.current) return

    // 清理之前的定时器
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    const renderDiagram = async () => {
      setIsLoading(true)
      setError(null)

      // 更新renderKey以强制重新渲染
      setRenderKey(prev => prev + 1)

      try {
        // 清空容器
        const container = containerRef.current
        if (container) {
          container.innerHTML = ''
        }

        // 生成唯一的图表ID
        const chartId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // 清理可能存在的旧图表和错误元素
        const existingElement = document.getElementById(chartId)
        if (existingElement) {
          existingElement.remove()
        }
        
        // 清理所有可能的mermaid错误元素
        const errorElements = document.querySelectorAll('[id*="mermaid"], [id*="dmermaid"], .mermaid-error, .error-icon')
        errorElements.forEach(el => {
          if (el.parentNode && !containerRef.current?.contains(el)) {
            el.remove()
          }
        })

        // 完整的mermaid初始化配置
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            deterministicIds: false,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 16,
            flowchart: {
              useMaxWidth: false,
              htmlLabels: true,
              curve: 'basis'
            },
            sequence: {
              useMaxWidth: false,
              mirrorActors: true,
              rightAngles: false,
              showSequenceNumbers: false
            },
            gantt: {
              useMaxWidth: false,
              // fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 14,
              // fontWeight: 'normal',
              gridLineStartPadding: 350,
              leftPadding: 40,
              rightPadding: 40,
              topPadding: 50,
              // bottomPadding: 50
            },
            state: {
              useMaxWidth: false,
              // stateFillColor: '#f9f9f9',
              // startStateFillColor: '#0f0f0f',
              // endStateFillColor: '#0f0f0f',
              // stateStrokeColor: '#333',
              // activeStateFillColor: '#e6e6e6',
              // activeStateStrokeColor: '#333'
            },
            class: {
              useMaxWidth: false,
              // fontFamily: 'Arial, Helvetica, sans-serif',
              // fontSize: 14,
              // fontWeight: 'normal'
            },
            // classDiagram: {
            //   useMaxWidth: false,
            //   fontFamily: 'Arial, Helvetica, sans-serif',
            //   fontSize: 14,
            //   fontWeight: 'normal'
            // },
            pie: {
              useMaxWidth: false,
              // fontFamily: 'Arial, Helvetica, sans-serif',
              // fontSize: 14,
              // fontWeight: 'normal'
            },
            mindmap: {
              useMaxWidth: false,
              // fontFamily: 'Arial, Helvetica, sans-serif',
              // fontSize: 14,
              // fontWeight: 'normal'
            },
            packet: {
              useMaxWidth: false,
            }
          })
        } catch (initError) {
          console.error('Mermaid重新初始化失败:', initError)
        }

        // 检测图表类型并进行特殊处理
        const diagramType = code.trim().split('\n')[0].toLowerCase()

        // 先尝试解析代码
        let canRender = true
        try {
          await mermaid.parse(code)
        } catch (parseError) {
          console.warn('Mermaid解析警告:', parseError)
          // 对于某些严重的解析错误，跳过渲染
          if (typeof parseError === 'object' && parseError !== null && 'message' in parseError && typeof parseError.message === 'string' && (parseError.message.includes('null') || parseError.message.includes('undefined'))) {
            canRender = false
            throw new Error('图表代码解析失败: ' + parseError.message)
          }
        }

        if (!canRender) {
          throw new Error('图表无法渲染')
        }

        // 渲染图表
        const { svg } = await mermaid.render(chartId, code)

        if (container && svg) {
          container.innerHTML = svg

          // 只有渲染成功后才更新lastCode
          setLastCode(code)

          // 优化SVG为真正的矢量渲染
          const svgElement = container.querySelector('svg')
          if (svgElement) {
            // 确保SVG保持矢量特性
            svgElement.style.maxWidth = 'none'
            svgElement.style.maxHeight = 'none'
            svgElement.style.width = 'auto'
            svgElement.style.height = 'auto'
            svgElement.style.display = 'block'
            svgElement.style.margin = '0 auto'

            // 核心矢量渲染设置
            svgElement.style.shapeRendering = 'geometricPrecision'
            svgElement.style.textRendering = 'geometricPrecision'
            svgElement.style.imageRendering = 'optimizeQuality'
            svgElement.style.vectorEffect = 'non-scaling-stroke'

            // 禁用所有可能导致像素化的属性
            svgElement.style.transform = 'none'
            svgElement.style.willChange = 'auto'
            svgElement.style.backfaceVisibility = 'visible'
            svgElement.style.perspective = 'none'
            svgElement.style.pointerEvents = 'none'

            // 确保字体以矢量方式渲染
            // svgElement.style.WebkitFontSmoothing = 'subpixel-antialiased'
            // svgElement.style.MozOsxFontSmoothing = 'auto'

            // 确保SVG有正确的viewBox属性
            if (!svgElement.getAttribute('viewBox')) {
              const bbox = svgElement.getBBox()
              svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`)
            }

            // 确保preserveAspectRatio设置正确
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
          }
        }
      } catch (err) {
        console.error('渲染Mermaid图表失败:', err)
        setError(err instanceof Error ? err.message : '渲染失败')
        // setErrorCode(code)
        setLastCode(code)

        // 清空容器以确保不显示旧内容
        const container = containerRef.current
        if (container) {
          container.innerHTML = ''
        }
      } finally {
        setIsLoading(false)
      }
    }

    // 使用短延时确保DOM更新
    renderTimeoutRef.current = setTimeout(renderDiagram, 50)

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [code, lastCode, error])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-800 tracking-wide">图表预览</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceRefresh}
              className="h-7 px-2 text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
              title="强制重新渲染图表"
            >
              <RefreshCw className="w-3 h-3 text-gray-500" />
              刷新
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyPng}
              className="h-7 px-2 text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-gray-500" />
              )}
              复制PNG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPng}
              className="h-7 px-2 text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-3 h-3 text-gray-500" />
              导出PNG
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-white mermaid-preview-container">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center max-w-md p-4">
              <div className="text-red-600 text-sm font-medium mb-2">渲染错误</div>
              <div className="text-red-500 text-xs mb-4">{error}</div>
              <div className="text-gray-600 text-xs">
                请检查Mermaid语法是否正确，或尝试使用示例模板
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={3}
            centerOnInit={true}
            wheel={{
              step: 0.1,
              activationKeys: [],
              wheelDisabled: false
            }}
            doubleClick={{
              disabled: false,
              step: 0.7
            }}
            limitToBounds={false}
            smooth={false}
            velocityAnimation={{
              sensitivity: 1,
              animationTime: 200,
              animationType: "easeOut"
            }}
            alignmentAnimation={{
              disabled: false,
              animationTime: 200,
              animationType: "easeOut"
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, centerView }) => (
              <>
                {/* 控制工具栏 */}
                <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => zoomIn()}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => zoomOut()}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetTransform()}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => centerView()}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>

                {/* 图表内容 */}
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                    cursor: 'grab',
                    imageRendering: 'auto',
                    transform: 'none',
                    willChange: 'auto',
                    backfaceVisibility: 'visible'
                  }}
                  contentStyle={{
                    // imageRendering: 'optimizeQuality',
                    WebkitFontSmoothing: 'subpixel-antialiased',
                    MozOsxFontSmoothing: 'auto',
                    transform: 'none',
                    willChange: 'auto',
                    backfaceVisibility: 'visible'
                  }}
                >
                  <div
                    ref={containerRef}
                    className="flex items-center justify-center p-4 min-h-[200px]"
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      // imageRendering: 'optimizeQuality',
                      WebkitFontSmoothing: 'subpixel-antialiased',
                      MozOsxFontSmoothing: 'auto',
                      transform: 'none',
                      willChange: 'auto',
                      backfaceVisibility: 'visible',
                      overflow: 'visible'
                    }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>
    </div>
  )
}
