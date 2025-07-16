/**
 * 保存的图表组件
 * 管理用户保存的Mermaid图表
 */
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit3, Save, Search, Calendar, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SavedDiagramsProps {
  onSelectDiagram: (code: string) => void
}

interface SavedDiagram {
  id: string
  name: string
  description: string
  code: string
  category: string
  createdAt: string
  updatedAt: string
}

export default function SavedDiagrams({ onSelectDiagram }: SavedDiagramsProps) {
  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null)
  const [editingDiagram, setEditingDiagram] = useState<SavedDiagram | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  /**
   * 从localStorage加载保存的图表
   */
  useEffect(() => {
    const savedDiagrams = localStorage.getItem('mermaid-saved-diagrams')
    if (savedDiagrams) {
      try {
        const parsed = JSON.parse(savedDiagrams)
        setDiagrams(parsed)
      } catch (error) {
        console.error('解析保存的图表失败:', error)
      }
    }
  }, [])

  /**
   * 保存图表到localStorage
   */
  const saveDiagramsToStorage = (newDiagrams: SavedDiagram[]) => {
    localStorage.setItem('mermaid-saved-diagrams', JSON.stringify(newDiagrams))
    setDiagrams(newDiagrams)
  }

  /**
   * 删除图表
   */
  const handleDeleteDiagram = (id: string) => {
    const newDiagrams = diagrams.filter(d => d.id !== id)
    saveDiagramsToStorage(newDiagrams)
    if (selectedDiagram === id) {
      setSelectedDiagram(null)
    }
  }

  /**
   * 选择图表
   */
  const handleSelectDiagram = (diagram: SavedDiagram) => {
    setSelectedDiagram(diagram.id)
    onSelectDiagram(diagram.code)
  }

  /**
   * 编辑图表
   */
  const handleEditDiagram = (diagram: SavedDiagram) => {
    setEditingDiagram(diagram)
    setIsDialogOpen(true)
  }

  /**
   * 保存编辑
   */
  const handleSaveEdit = () => {
    if (!editingDiagram) return

    const newDiagrams = diagrams.map(d => 
      d.id === editingDiagram.id 
        ? { ...editingDiagram, updatedAt: new Date().toISOString() }
        : d
    )
    saveDiagramsToStorage(newDiagrams)
    setIsDialogOpen(false)
    setEditingDiagram(null)
  }

  /**
   * 过滤图表
   */
  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diagram.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diagram.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  /**
   * 获取类别标签和颜色
   */
  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      flowchart: { label: '流程图', color: 'bg-blue-50 text-blue-600' },
      sequence: { label: '序列图', color: 'bg-green-50 text-green-600' },
      class: { label: '类图', color: 'bg-purple-50 text-purple-600' },
      state: { label: '状态图', color: 'bg-orange-50 text-orange-600' },
      gantt: { label: '甘特图', color: 'bg-pink-50 text-pink-600' },
      pie: { label: '饼图', color: 'bg-yellow-50 text-yellow-600' },
      mindmap: { label: '思维导图', color: 'bg-indigo-50 text-indigo-600' },
      other: { label: '其他', color: 'bg-gray-50 text-gray-600' }
    }
    return categoryMap[category as keyof typeof categoryMap] || categoryMap.other
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 搜索栏 */}
      <div className="flex-shrink-0 px-6 py-5 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索图表..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors"
          />
        </div>
      </div>
      
      {/* 图表列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredDiagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-sm font-medium">
              {diagrams.length === 0 ? '还没有保存的图表' : '没有找到匹配的图表'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {diagrams.length === 0 ? '创建图表后可以保存到这里' : '尝试使用其他关键词搜索'}
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredDiagrams.map((diagram) => {
              const categoryInfo = getCategoryInfo(diagram.category)
              
              return (
                <Card 
                  key={diagram.id} 
                  className={`group cursor-pointer border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 ${
                    selectedDiagram === diagram.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectDiagram(diagram)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-semibold text-gray-900 mb-1">
                          {diagram.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 leading-relaxed">
                          {diagram.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 h-auto text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditDiagram(diagram)
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDiagram(diagram.id)
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* 代码预览 */}
                      <div className="bg-gray-50 p-3 border border-gray-200">
                        <pre className="text-xs text-gray-600 font-mono leading-relaxed overflow-hidden">
                          <code className="line-clamp-3">
                            {diagram.code}
                          </code>
                        </pre>
                      </div>
                      
                      {/* 分类和时间 */}
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant="secondary" 
                          className={`${categoryInfo.color} text-xs px-3 py-1.5 font-medium border-0`}
                        >
                          {categoryInfo.label}
                        </Badge>
                        <div className="flex items-center text-gray-400 font-medium">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(diagram.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">编辑图表</DialogTitle>
          </DialogHeader>
          {editingDiagram && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  图表名称
                </Label>
                <Input
                  id="name"
                  value={editingDiagram.name}
                  onChange={(e) => setEditingDiagram({
                    ...editingDiagram,
                    name: e.target.value
                  })}
                  className="border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                  图表描述
                </Label>
                <Textarea
                  id="description"
                  value={editingDiagram.description}
                  onChange={(e) => setEditingDiagram({
                    ...editingDiagram,
                    description: e.target.value
                  })}
                  className="min-h-[80px] border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none transition-colors"
                  rows={3}
                  placeholder="请输入图表描述..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
