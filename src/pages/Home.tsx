/**
 * 首页组件
 * Mermaid在线编辑器的主界面
 */
import { useState, useCallback, useEffect } from 'react'
import MermaidEditor from '../components/MermaidEditor'
import MermaidPreview from '../components/MermaidPreview'
import ExampleTemplates from '../components/ExampleTemplates'
import SavedDiagrams from '../components/SavedDiagrams'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerClose } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Save, FileText, Palette, Code, BookOpen, X } from 'lucide-react'
import '../styles/editor.css'

interface SavedDiagram {
  id: string
  name: string
  description: string
  code: string
  category: string
  createdAt: string
  updatedAt: string
  folder?: string // 所属文件夹路径
}

export default function Home() {
  const [mermaidCode, setMermaidCode] = useState(`flowchart TD
    A[开始] --> B{是否登录?}
    B -->|是| C[显示主页]
    B -->|否| D[显示登录页]
    C --> E[用户操作]
    D --> F[用户登录]
    F --> C
    E --> G[结束]`)

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [saveFolder, setSaveFolder] = useState('')
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false)
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false)
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null)
  const [activeDiagramTitle, setActiveDiagramTitle] = useState<string>('')
  const [activeDiagramFolder, setActiveDiagramFolder] = useState<string>('')

  // 支持通过 URL 参数 ?code=BASE64 预填充代码（兼容 URL-Safe Base64）
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const raw = params.get('code')
      console.log('raw', raw)
      if (raw) {
        // 兼容多种来源：
        // - URL-safe Base64: '-' '_' → '+' '/'
        // - '+' 被当作空格的情况: ' ' → '+'
        // - 去除换行/制表符
        const normalized = raw
          .replace(/ /g, '+')
          .replace(/[\r\n\t]/g, '')
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
        // 优先尝试 atob，若失败回退到 decodeURIComponent + atob（应对未正确编码的参数）
        let binary: string
        try {
          binary = atob(padded)
        } catch {
          binary = atob(decodeURIComponent(padded))
        }
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
        const decoded = new TextDecoder().decode(bytes)
        setMermaidCode(decoded)
        setActiveDiagramId(null)
        setActiveDiagramTitle('')
        setActiveDiagramFolder('')
      }
    } catch (e) {
      // 忽略无效的 base64 内容
      console.error('解析 URL code 失败:', e)
    }
  }, [])

  /**
   * 处理代码变化
   */
  const handleCodeChange = useCallback((newCode: string) => {
    setMermaidCode(newCode)
  }, [])

  /**
   * 处理选择模板
   */
  const handleSelectTemplate = useCallback((code: string) => {
    setActiveDiagramId(null)
    setActiveDiagramTitle('')
    setActiveDiagramFolder('')
    setMermaidCode(code)
  }, [])

  /**
   * 处理选择保存的图表
   */
  const handleSelectDiagram = useCallback((payload: { id: string; code: string }) => {
    setActiveDiagramId(payload.id)
    try {
      const all: SavedDiagram[] = JSON.parse(localStorage.getItem('mermaid-saved-diagrams') || '[]')
      const found = all.find(d => d.id === payload.id)
      setActiveDiagramTitle(found?.name || '')
      setActiveDiagramFolder(found?.folder || '')
    } catch {
      setActiveDiagramTitle('')
      setActiveDiagramFolder('')
    }
    setMermaidCode(payload.code)
  }, [])

  /**
   * 保存图表
   */
  const handleSaveDiagram = useCallback(() => {
    if (!saveName.trim()) {
      return
    }

    const savedDiagrams = JSON.parse(localStorage.getItem('mermaid-saved-diagrams') || '[]')
    
    const newDiagram: SavedDiagram = {
      id: Date.now().toString(),
      name: saveName.trim(),
      description: saveDescription.trim(),
      code: mermaidCode,
      category: getCategory(mermaidCode),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: saveFolder || undefined
    }

    savedDiagrams.push(newDiagram)
    localStorage.setItem('mermaid-saved-diagrams', JSON.stringify(savedDiagrams))
    
    setIsSaveDialogOpen(false)
    setSaveName('')
    setSaveDescription('')
    setSaveFolder('')
  }, [mermaidCode, saveName, saveDescription])

  /**
   * 更新当前打开的保存图表代码
   */
  const handleUpdateActiveDiagram = useCallback(() => {
    if (!activeDiagramId) return
    const savedDiagrams: SavedDiagram[] = JSON.parse(localStorage.getItem('mermaid-saved-diagrams') || '[]')
    const next = savedDiagrams.map(d => d.id === activeDiagramId ? { ...d, code: mermaidCode, category: getCategory(mermaidCode), updatedAt: new Date().toISOString() } : d)
    localStorage.setItem('mermaid-saved-diagrams', JSON.stringify(next))
    // 主动派发事件通知侧边栏刷新
    try {
      window.dispatchEvent(new Event('mermaid-diagrams-updated'))
    } catch {}
  }, [activeDiagramId, mermaidCode])

  /**
   * 获取所有文件夹路径
   */
  const getAllFolderPaths = (): string[] => {
    const savedFolders = localStorage.getItem('mermaid-folders')
    return savedFolders ? JSON.parse(savedFolders) : []
  }

  /**
   * 获取图表类型
   */
  const getCategory = (code: string): string => {
    const firstLine = code.trim().split('\n')[0].toLowerCase()
    if (firstLine.includes('graph') || firstLine.includes('flowchart')) return 'flowchart'
    if (firstLine.includes('sequence')) return 'sequence'
    if (firstLine.includes('class')) return 'class'
    if (firstLine.includes('state')) return 'state'
    if (firstLine.includes('gantt')) return 'gantt'
    if (firstLine.includes('pie')) return 'pie'
    if (firstLine.includes('mindmap')) return 'mindmap'
    return 'other'
  }



  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex-shrink-0">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-xl mr-3 border border-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Mermaid 在线编辑器</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Drawer open={isTemplateDrawerOpen} onOpenChange={setIsTemplateDrawerOpen} direction="left">
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors">
                    <BookOpen className="w-4 h-4" />
                    示例模板
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-screen w-[90vw] max-w-[600px] fixed left-0 top-0 bottom-0 border-r border-slate-200 bg-white flex flex-col">
                  <DrawerHeader className="border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <DrawerTitle className="text-slate-900 font-medium">示例模板</DrawerTitle>
                        <DrawerDescription className="text-slate-500">选择一个模板快速开始</DrawerDescription>
                      </div>
                      <DrawerClose asChild>
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors">
                          <X className="w-4 h-4" />
                        </Button>
                      </DrawerClose>
                    </div>
                  </DrawerHeader>
                  <div className="flex-1 overflow-y-auto">
                    <ExampleTemplates onSelectTemplate={(code) => {
                      handleSelectTemplate(code)
                      setIsTemplateDrawerOpen(false)
                    }} />
                  </div>
                </DrawerContent>
              </Drawer>

              <Drawer open={isSavedDrawerOpen} onOpenChange={setIsSavedDrawerOpen} direction="left">
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors">
                    <Save className="w-4 h-4" />
                    我的保存
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-screen w-[90vw] max-w-[600px] fixed left-0 top-0 bottom-0 border-r border-slate-200 bg-white flex flex-col">
                  <DrawerHeader className="border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <DrawerTitle className="text-slate-900 font-medium">我的保存</DrawerTitle>
                        <DrawerDescription className="text-slate-500">管理您保存的图表</DrawerDescription>
                      </div>
                      <DrawerClose asChild>
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors">
                          <X className="w-4 h-4" />
                        </Button>
                      </DrawerClose>
                    </div>
                  </DrawerHeader>
                  <div className="flex-1 overflow-y-auto">
                  <SavedDiagrams onSelectDiagram={(payload) => {
                      handleSelectDiagram(payload)
                      setIsSavedDrawerOpen(false)
                    }} />
                  </div>
                </DrawerContent>
              </Drawer>


              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    <Save className="w-4 h-4" />
                    本地保存
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-slate-200">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 font-medium">本地保存</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-slate-700 font-medium">图表名称</Label>
                      <Input
                        id="name"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="请输入图表名称"
                        className="border-slate-200 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-slate-700 font-medium">描述（可选）</Label>
                      <Textarea
                        id="description"
                        value={saveDescription}
                        onChange={(e) => setSaveDescription(e.target.value)}
                        placeholder="请输入图表描述"
                        rows={3}
                        className="border-slate-200 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder" className="text-slate-700 font-medium">保存到文件夹</Label>
                      <select
                        id="folder"
                        value={saveFolder}
                        onChange={(e) => setSaveFolder(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-colors"
                      >
                        <option value="">根目录</option>
                        {getAllFolderPaths().map(path => (
                          <option key={path} value={path}>{path}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors">
                        取消
                      </Button>
                      <Button onClick={handleSaveDiagram} className="bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                        保存
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 左侧编辑器 */}
          <ResizablePanel defaultSize={20} minSize={20}>
            <div className="h-full border-r border-gray-200 bg-white">
              {/* <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-900">代码编辑器</h2>
                </div>
              </div> */}
              <div className="h-full">
                <MermaidEditor
                  value={mermaidCode}
                  onChange={handleCodeChange}
                  className="h-full"
                  showUpdate={!!activeDiagramId}
                  onUpdate={handleUpdateActiveDiagram}
                  activeTitle={activeDiagramTitle}
                  activeFolder={activeDiagramFolder}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-gray-300" />

          {/* 右侧预览区 */}
          <ResizablePanel defaultSize={80} minSize={30}>
            <div className="h-full bg-white">
              {/* <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-semibold text-gray-900">预览</h2>
                </div>
              </div> */}
              <div className="h-full">
                <MermaidPreview
                  code={mermaidCode}
                  className="h-full"
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  )
}
