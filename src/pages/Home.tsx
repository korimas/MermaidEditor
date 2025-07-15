/**
 * Mermaid 编辑器主页面
 * 集成代码编辑器、实时预览和模板选择功能
 */
import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import MermaidEditor from '@/components/MermaidEditor'
import MermaidPreview from '@/components/MermaidPreview'
import ExampleTemplates from '@/components/ExampleTemplates'
import SavedDiagrams from '@/components/SavedDiagrams'

export default function Home() {
  const [mermaidCode, setMermaidCode] = useState(`graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E`)

  /**
   * 处理模板选择，使用useCallback优化性能
   */
  const handleTemplateSelect = useCallback((code: string) => {
    setMermaidCode(code)
  }, [])

  /**
   * 处理代码变更，使用useCallback优化性能
   */
  const handleCodeChange = useCallback((code: string) => {
    setMermaidCode(code)
  }, [])

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 头部标题 */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Mermaid 在线编辑器
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* 左侧编辑区域 */}
          <Panel defaultSize={30} minSize={20} maxSize={80}>
            <div className="h-full bg-white border-r border-gray-200 overflow-hidden">
              <Tabs defaultValue="editor" className="h-full flex flex-col">
                <div className="flex-shrink-0 border-b border-gray-200">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 rounded-none h-auto p-0">
                    <TabsTrigger 
                      value="editor" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent bg-transparent text-sm py-3 px-4 rounded-none border-r border-gray-200 hover:bg-gray-50"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      代码
                    </TabsTrigger>
                    <TabsTrigger 
                      value="templates"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent bg-transparent text-sm py-3 px-4 rounded-none border-r border-gray-200 hover:bg-gray-50"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      模板
                    </TabsTrigger>
                    <TabsTrigger 
                      value="saved"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent bg-transparent text-sm py-3 px-4 rounded-none hover:bg-gray-50"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
                      </svg>
                      我的保存
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="editor" className="flex-1 mt-0 overflow-hidden">
                  <MermaidEditor
                    value={mermaidCode}
                    onChange={handleCodeChange}
                    className="h-full"
                  />
                </TabsContent>
                
                <TabsContent value="templates" className="flex-1 mt-0 overflow-auto">
                  <ExampleTemplates onSelectTemplate={handleTemplateSelect} />
                </TabsContent>
                
                <TabsContent value="saved" className="flex-1 mt-0 overflow-auto">
                  <SavedDiagrams onSelectDiagram={handleTemplateSelect} />
                </TabsContent>
              </Tabs>
            </div>
          </Panel>

          {/* 可拖拽的分割线 */}
          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors duration-200 cursor-col-resize panel-resize-handle" />

          {/* 右侧预览区域 */}
          <Panel defaultSize={70} minSize={20} maxSize={80}>
            <div className="h-full bg-white overflow-hidden">
              <MermaidPreview code={mermaidCode} />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
