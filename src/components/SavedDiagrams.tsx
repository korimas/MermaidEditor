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
      flowchart: { label: '流程图', color: 'bg-blue-100 text-blue-800' },
      sequence: { label: '序列图', color: 'bg-green-100 text-green-800' },
      class: { label: '类图', color: 'bg-purple-100 text-purple-800' },
      state: { label: '状态图', color: 'bg-orange-100 text-orange-800' },
      gantt: { label: '甘特图', color: 'bg-red-100 text-red-800' },
      pie: { label: '饼图', color: 'bg-yellow-100 text-yellow-800' },
      mindmap: { label: '思维导图', color: 'bg-pink-100 text-pink-800' },
      other: { label: '其他', color: 'bg-gray-100 text-gray-800' }
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
    <div className="h-full flex flex-col">
      {/* 搜索栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索图表..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>
      
      {/* 图表列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredDiagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-sm">
              {diagrams.length === 0 ? '还没有保存的图表' : '没有找到匹配的图表'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {diagrams.length === 0 ? '创建图表后可以保存到这里' : '尝试使用其他关键词搜索'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredDiagrams.map((diagram) => {
              const categoryInfo = getCategoryInfo(diagram.category)
              
              return (
                <Card 
                  key={diagram.id} 
                  className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                    selectedDiagram === diagram.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                  onClick={() => handleSelectDiagram(diagram)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {diagram.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {diagram.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditDiagram(diagram)
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-auto text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDiagram(diagram.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 rounded-md p-3 mb-3">
                      <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {diagram.code.split('\n').slice(0, 3).join('\n')}
                        {diagram.code.split('\n').length > 3 && '\n...'}
                      </pre>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(diagram.updatedAt)}
                        </span>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑图表</DialogTitle>
          </DialogHeader>
          {editingDiagram && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  名称
                </Label>
                <Input
                  id="name"
                  value={editingDiagram.name}
                  onChange={(e) => setEditingDiagram({
                    ...editingDiagram,
                    name: e.target.value
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  描述
                </Label>
                <Textarea
                  id="description"
                  value={editingDiagram.description}
                  onChange={(e) => setEditingDiagram({
                    ...editingDiagram,
                    description: e.target.value
                  })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
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
