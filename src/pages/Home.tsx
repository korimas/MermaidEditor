/**
 * 首页组件
 * Mermaid在线编辑器的主界面
 */
import { useState, useCallback } from 'react'
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
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false)
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false)

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
    setMermaidCode(code)
  }, [])

  /**
   * 处理选择保存的图表
   */
  const handleSelectDiagram = useCallback((code: string) => {
    setMermaidCode(code)
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
      updatedAt: new Date().toISOString()
    }

    savedDiagrams.push(newDiagram)
    localStorage.setItem('mermaid-saved-diagrams', JSON.stringify(savedDiagrams))
    
    setIsSaveDialogOpen(false)
    setSaveName('')
    setSaveDescription('')
  }, [mermaidCode, saveName, saveDescription])

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
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Mermaid 在线编辑器</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Drawer open={isTemplateDrawerOpen} onOpenChange={setIsTemplateDrawerOpen} direction="left">
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    示例模板
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-screen w-[640px] fixed left-0 top-0 border-r flex flex-col">
                  <DrawerHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <DrawerTitle>示例模板</DrawerTitle>
                        <DrawerDescription>选择一个模板快速开始</DrawerDescription>
                      </div>
                      <DrawerClose asChild>
                        <Button variant="outline" size="sm">
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
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    我的保存
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-screen w-[640px] fixed left-0 top-0 border-r flex flex-col">
                  <DrawerHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <DrawerTitle>我的保存</DrawerTitle>
                        <DrawerDescription>管理您保存的图表</DrawerDescription>
                      </div>
                      <DrawerClose asChild>
                        <Button variant="outline" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </DrawerClose>
                    </div>
                  </DrawerHeader>
                  <div className="flex-1 overflow-y-auto">
                    <SavedDiagrams onSelectDiagram={(code) => {
                      handleSelectDiagram(code)
                      setIsSavedDrawerOpen(false)
                    }} />
                  </div>
                </DrawerContent>
              </Drawer>


              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    保存图表
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>保存图表</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">图表名称</Label>
                      <Input
                        id="name"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="请输入图表名称"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">描述（可选）</Label>
                      <Textarea
                        id="description"
                        value={saveDescription}
                        onChange={(e) => setSaveDescription(e.target.value)}
                        placeholder="请输入图表描述"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSaveDiagram}>
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
            <Card className="h-full border-0 rounded-none">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  代码编辑器
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)]">
                <MermaidEditor
                  value={mermaidCode}
                  onChange={handleCodeChange}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 右侧预览区 */}
          <ResizablePanel defaultSize={80} minSize={30}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  预览
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)]">
                <MermaidPreview
                  code={mermaidCode}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  )
}
