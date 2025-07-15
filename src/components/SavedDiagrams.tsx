/**
 * 保存的图表组件
 * 显示用户保存的Mermaid图表
 */
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Trash2, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface SavedDiagram {
  name: string
  code: string
  createdAt: string
  updatedAt: string
}

interface SavedDiagramsProps {
  onSelectDiagram: (code: string) => void
  className?: string
}

export default function SavedDiagrams({ onSelectDiagram, className = '' }: SavedDiagramsProps) {
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([])

  /**
   * 加载保存的图表
   */
  const loadSavedDiagrams = () => {
    try {
      const saves = JSON.parse(localStorage.getItem('mermaid-saves') || '[]')
      // 按更新时间倒序排列
      const sortedSaves = saves.sort((a: SavedDiagram, b: SavedDiagram) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      setSavedDiagrams(sortedSaves)
    } catch (error) {
      console.error('加载保存项失败:', error)
      setSavedDiagrams([])
    }
  }

  useEffect(() => {
    loadSavedDiagrams()
    
    // 监听storage变化，当有新的保存时自动更新
    const handleStorageChange = () => {
      loadSavedDiagrams()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 监听自定义事件（同页面内的保存）
    window.addEventListener('mermaid-save-updated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('mermaid-save-updated', handleStorageChange)
    }
  }, [])

  /**
   * 删除保存的图表
   */
  const deleteSavedDiagram = (name: string) => {
    try {
      const saves = JSON.parse(localStorage.getItem('mermaid-saves') || '[]')
      const updatedSaves = saves.filter((save: SavedDiagram) => save.name !== name)
      localStorage.setItem('mermaid-saves', JSON.stringify(updatedSaves))
      loadSavedDiagrams()
      toast.success(`已删除: ${name}`)
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  /**
   * 格式化时间
   */
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }



  if (savedDiagrams.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium mb-1">还没有保存的图表</p>
          <p className="text-sm">点击预览区域的保存按钮来保存您的图表</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">我的保存 ({savedDiagrams.length})</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSavedDiagrams}
          className="text-xs h-6 px-2"
        >
          刷新
        </Button>
      </div>
      
      <div className="space-y-3">
        {savedDiagrams.map((diagram) => (
          <Card key={diagram.name} className="border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-800 truncate pr-2">
                    {diagram.name}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 space-x-3 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(diagram.updatedAt)}</span>
                    </div>
                    {diagram.createdAt !== diagram.updatedAt && (
                      <span className="text-blue-600">已更新</span>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除保存的图表 "{diagram.name}" 吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteSavedDiagram(diagram.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectDiagram(diagram.code)}
                className="w-full text-xs h-8 hover:bg-blue-50 hover:border-blue-300"
              >
                加载此图表
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
