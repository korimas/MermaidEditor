/**
 * 保存的图表组件
 * 管理用户保存的Mermaid图表
 */
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit3, Save, Search, Calendar, FileText, Folder, FolderPlus, ChevronRight, ChevronDown, MoreVertical, Move } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
  folder?: string // 所属文件夹路径
}

interface FolderStructure {
  [key: string]: {
    expanded: boolean
    subfolders: FolderStructure
    diagrams: SavedDiagram[]
  }
}

export default function SavedDiagrams({ onSelectDiagram }: SavedDiagramsProps) {
  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null)
  const [editingDiagram, setEditingDiagram] = useState<SavedDiagram | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({})
  const [draggedItem, setDraggedItem] = useState<{ type: 'diagram' | 'folder', id: string, data: any } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, type: 'diagram' | 'folder' } | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renamingItem, setRenamingItem] = useState<{ type: 'folder', path: string, name: string } | null>(null)
  const [newName, setNewName] = useState('')
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [movingDiagram, setMovingDiagram] = useState<SavedDiagram | null>(null)
  const [selectedFolderForMove, setSelectedFolderForMove] = useState<string>('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverFolder, setDragOverFolder] = useState<string>('')

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
   * 构建文件夹结构
   */
  useEffect(() => {
    const structure: FolderStructure = {}
    
    // 从localStorage加载保存的文件夹
    const savedFolders = localStorage.getItem('mermaid-folders')
    const folderPaths: string[] = savedFolders ? JSON.parse(savedFolders) : []
    
    // 创建所有文件夹结构
    folderPaths.forEach(folderPath => {
      const folders = folderPath.split('/').filter(f => f)
      let current = structure
      
      folders.forEach((folder, index) => {
        if (!current[folder]) {
          current[folder] = {
            expanded: false,
            subfolders: {},
            diagrams: []
          }
        }
        if (index < folders.length - 1) {
          current = current[folder].subfolders
        }
      })
    })
    
    // 从图表中提取文件夹路径并创建结构
    diagrams.forEach(diagram => {
      const folderPath = diagram.folder || ''
      if (folderPath) {
        const folders = folderPath.split('/').filter(f => f)
        let current = structure
        
        folders.forEach((folder, index) => {
          if (!current[folder]) {
            current[folder] = {
              expanded: false,
              subfolders: {},
              diagrams: []
            }
          }
          if (index < folders.length - 1) {
            current = current[folder].subfolders
          }
        })
      }
    })
    
    // 清空所有文件夹的diagrams数组，然后重新分配
    const clearDiagrams = (struct: FolderStructure) => {
      Object.values(struct).forEach(folder => {
        folder.diagrams = []
        clearDiagrams(folder.subfolders)
      })
    }
    clearDiagrams(structure)
    
    // 重新分配图表到对应文件夹
    diagrams.forEach(diagram => {
      const folderPath = diagram.folder || ''
      if (folderPath) {
        const targetFolder = getFolderByPath(structure, folderPath)
        if (targetFolder) {
          targetFolder.diagrams.push(diagram)
        }
      }
    })
    
    setFolderStructure(structure)
  }, [diagrams])

  /**
   * 根据路径获取文件夹
   */
  const getFolderByPath = (structure: FolderStructure, path: string) => {
    const folders = path.split('/').filter(f => f)
    let current = structure
    
    for (const folder of folders) {
      if (!current[folder]) return null
      if (folders.indexOf(folder) === folders.length - 1) {
        return current[folder]
      }
      current = current[folder].subfolders
    }
    return null
  }

  /**
   * 创建新文件夹
   */
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    
    const folderPath = currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName
    
    // 检查文件夹名是否包含非法字符
    if (newFolderName.includes('/')) {
      alert('文件夹名不能包含斜杠')
      return
    }
    
    // 检查文件夹是否已存在
    const existingPaths = getAllFolderPaths()
    if (existingPaths.includes(folderPath)) {
      alert('文件夹已存在')
      return
    }
    
    // 保存文件夹信息到localStorage
    const savedFolders = localStorage.getItem('mermaid-folders') || '[]'
    const folders = JSON.parse(savedFolders)
    folders.push(folderPath)
    localStorage.setItem('mermaid-folders', JSON.stringify(folders))
    
    // 手动更新文件夹结构
    const newStructure = { ...folderStructure }
    const pathParts = folderPath.split('/')
    let current = newStructure
    
    pathParts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          expanded: false,
          subfolders: {},
          diagrams: []
        }
      }
      if (index < pathParts.length - 1) {
        current = current[part].subfolders
      }
    })
    
    setFolderStructure(newStructure)
    setNewFolderName('')
    setIsFolderDialogOpen(false)
  }

  /**
   * 切换文件夹展开状态
   */
  const toggleFolder = (folderPath: string) => {
    const folder = getFolderByPath(folderStructure, folderPath)
    if (folder) {
      folder.expanded = !folder.expanded
      setFolderStructure({...folderStructure})
    }
  }

  /**
   * 切换文件夹选中状态
   */
  const toggleFolderSelection = (folderPath: string) => {
    if (selectedFolder === folderPath) {
      setSelectedFolder(null) // 取消选中
    } else {
      setSelectedFolder(folderPath) // 选中
    }
  }

  /**
   * 递归计算文件夹中的总图表数量（包含子文件夹）
   */
  const getTotalDiagramCount = (folder: FolderStructure[string]): number => {
    let count = folder.diagrams.length
    Object.values(folder.subfolders).forEach(subfolder => {
      count += getTotalDiagramCount(subfolder)
    })
    return count
  }

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
  const filteredDiagrams = diagrams.filter(diagram => {
    const matchesSearch = diagram.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagram.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagram.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  /**
   * 获取当前文件夹中的根级图表（没有文件夹的图表）
   */
  const getRootDiagrams = () => {
    return diagrams.filter(diagram => !diagram.folder)
  }

  /**
   * 渲染文件夹树
   */
  const renderFolderTree = (structure: FolderStructure, basePath: string = '') => {
    return Object.entries(structure).map(([folderName, folder]) => {
      const fullPath = basePath ? `${basePath}/${folderName}` : folderName
      const isCurrentFolder = currentFolder === fullPath
      
      return (
        <div key={fullPath} className="mb-1">
          <div 
            className={`flex items-center px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${
              isCurrentFolder 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setCurrentFolder(isCurrentFolder ? '' : fullPath)}
          >
            <button
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(fullPath)
              }}
            >
              {folder.expanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </button>
            <Folder className="w-4 h-4 mr-2" />
            <span className="flex-1">{folderName}</span>
            <span className="text-xs text-gray-400">
              {folder.diagrams.length}
            </span>
          </div>
          
          {folder.expanded && (
            <div className="ml-4 border-l border-gray-200 pl-2">
              {renderFolderTree(folder.subfolders, fullPath)}
            </div>
          )}
        </div>
      )
    })
  }

  /**
   * 获取所有文件夹路径
   */
  const getAllFolderPaths = (): string[] => {
    const paths: string[] = []
    
    const collectPaths = (structure: FolderStructure, basePath: string = '') => {
      Object.entries(structure).forEach(([folderName, folder]) => {
        const fullPath = basePath ? `${basePath}/${folderName}` : folderName
        paths.push(fullPath)
        collectPaths(folder.subfolders, fullPath)
      })
    }
    
    collectPaths(folderStructure)
    return paths.sort()
  }

  /**
   * 渲染图表项
   */
  const renderDiagramItem = (diagram: SavedDiagram) => {
    const categoryInfo = getCategoryInfo(diagram.category)
    
    return (
      <div
        key={diagram.id}
        className={`group flex items-center px-3 py-2 text-sm cursor-pointer rounded-md transition-all duration-200 ${
          isDragging && draggedItem?.id === diagram.id 
            ? 'opacity-50 scale-95 bg-gray-100' 
            : 'hover:bg-gray-100'
        }`}
        onClick={() => handleSelectDiagram(diagram)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item: diagram,
            type: 'diagram'
          })
        }}
        draggable
        onDragStart={(e) => {
          setDraggedItem({ type: 'diagram', id: diagram.id, data: diagram })
          setIsDragging(true)
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', diagram.id)
        }}
        onDragEnd={() => {
          setIsDragging(false)
          setDraggedItem(null)
          setDragOverFolder('')
        }}
      >
        <FileText className="w-4 h-4 mr-3 text-gray-400" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{diagram.name}</div>
          <div className="text-xs text-gray-500 truncate">{diagram.description}</div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
          <Badge 
            variant="secondary" 
            className={`${categoryInfo.color} text-xs px-2 py-0.5 font-medium border-0`}
          >
            {categoryInfo.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 hover:text-blue-600"
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
            className="p-1 h-auto text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteDiagram(diagram.id)
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  /**
   * 渲染带图表的文件夹树
   */
  const renderFolderTreeWithDiagrams = (structure: FolderStructure, basePath: string = '', level: number = 0) => {
    return Object.entries(structure).map(([folderName, folder]) => {
      const fullPath = basePath ? `${basePath}/${folderName}` : folderName
      
      return (
        <div key={fullPath} className="mb-1">
          <div 
            className={`group flex items-center px-3 py-2 text-sm cursor-pointer rounded-md transition-colors duration-200 ${
              dragOverFolder === fullPath 
                ? 'bg-blue-100 text-blue-800 shadow-md ring-2 ring-blue-300' 
                : selectedFolder === fullPath
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
            onClick={(e) => {
              // 点击整个条目都可以展开/收起文件夹
              toggleFolder(fullPath)
              // 设置选中状态（不切换，直接设置为选中）
              setSelectedFolder(fullPath)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              setSelectedFolder(fullPath)
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                item: { name: folderName, path: fullPath },
                type: 'folder'
              })
            }}
            draggable
            onDragStart={(e) => {
              setDraggedItem({ type: 'folder', id: fullPath, data: { name: folderName, path: fullPath } })
              setIsDragging(true)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => {
              setIsDragging(false)
              setDraggedItem(null)
              setDragOverFolder('')
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (draggedItem && draggedItem.type === 'diagram' && draggedItem.id !== fullPath) {
                e.dataTransfer.dropEffect = 'move'
                setDragOverFolder(fullPath)
              }
            }}
            onDragLeave={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX
              const y = e.clientY
              if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                setDragOverFolder('')
              }
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Dropping diagram:', draggedItem?.id, 'to folder:', fullPath)
              setDragOverFolder('')
              if (draggedItem && draggedItem.type === 'diagram') {
                handleMoveDiagram(draggedItem.id, fullPath)
              }
              setDraggedItem(null)
              setIsDragging(false)
            }}
          >
            <button
              className="mr-2 p-0.5 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation()
                // 不需要再调用toggleFolder，因为父元素的onClick已经处理了
              }}
            >
              {folder.expanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </button>
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
            <span className="flex-1 font-medium text-gray-900">{folderName}</span>
            <span className="text-xs text-gray-400 mr-2">
              {getTotalDiagramCount(folder)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFolder(fullPath)
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          
          {folder.expanded && (
            <div>
              {/* 文件夹中的图表 */}
              {folder.diagrams.map((diagram) => (
                <div key={diagram.id} style={{ paddingLeft: `${28 + level * 16}px` }}>
                  {renderDiagramItem(diagram)}
                </div>
              ))}
              
              {/* 子文件夹 */}
              {renderFolderTreeWithDiagrams(folder.subfolders, fullPath, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  /**
   * 删除文件夹
   */
  const handleDeleteFolder = (folderPath: string) => {
    // 检查文件夹中是否有图表
    const diagramsInFolder = diagrams.filter(d => d.folder?.startsWith(folderPath))
    const hasSubfolders = getAllFolderPaths().some(path => path.startsWith(folderPath + '/') && path !== folderPath)
    
    let confirmMessage = `确定要删除文件夹 "${folderPath}" 吗？`
    if (diagramsInFolder.length > 0) {
      confirmMessage += `\n文件夹中包含 ${diagramsInFolder.length} 个图表，删除后将无法恢复。`
    }
    if (hasSubfolders) {
      confirmMessage += `\n文件夹中还包含子文件夹，也会一并删除。`
    }
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    // 删除文件夹中的所有图表
    const newDiagrams = diagrams.filter(d => !d.folder?.startsWith(folderPath))
    saveDiagramsToStorage(newDiagrams)
    
    // 从localStorage中删除文件夹及其子文件夹
    const savedFolders = localStorage.getItem('mermaid-folders')
    if (savedFolders) {
      const folders = JSON.parse(savedFolders)
      const newFolders = folders.filter((f: string) => !f.startsWith(folderPath))
      localStorage.setItem('mermaid-folders', JSON.stringify(newFolders))
    }
  }

  /**
   * 移动图表到文件夹
   */
  const handleMoveDiagram = (diagramId: string, targetFolder: string) => {
    console.log('handleMoveDiagram called:', { diagramId, targetFolder })
    
    // 查找要移动的图表
    const diagramToMove = diagrams.find(d => d.id === diagramId)
    if (!diagramToMove) {
      console.error('Diagram not found:', diagramId)
      return
    }
    
    console.log('Moving diagram:', diagramToMove.name, 'from:', diagramToMove.folder, 'to:', targetFolder)
    
    // 保存当前文件夹的展开状态
    const saveExpandedState = (structure: FolderStructure): { [key: string]: boolean } => {
      const expandedState: { [key: string]: boolean } = {}
      const traverse = (struct: FolderStructure, basePath: string = '') => {
        Object.entries(struct).forEach(([folderName, folder]) => {
          const fullPath = basePath ? `${basePath}/${folderName}` : folderName
          expandedState[fullPath] = folder.expanded
          traverse(folder.subfolders, fullPath)
        })
      }
      traverse(structure)
      return expandedState
    }
    
    const expandedState = saveExpandedState(folderStructure)
    
    const newDiagrams = diagrams.map(d => 
      d.id === diagramId 
        ? { ...d, folder: targetFolder || undefined, updatedAt: new Date().toISOString() }
        : d
    )
    
    console.log('Updated diagrams:', newDiagrams.find(d => d.id === diagramId))
    
    // 更新diagrams后，在useEffect中会重新构建文件夹结构
    // 我们需要在构建完成后恢复展开状态
    saveDiagramsToStorage(newDiagrams)
    
    // 使用setTimeout确保在文件夹结构重新构建后恢复展开状态
    setTimeout(() => {
      setFolderStructure(prevStructure => {
        const restoreExpandedState = (structure: FolderStructure) => {
          const traverse = (struct: FolderStructure, basePath: string = '') => {
            Object.entries(struct).forEach(([folderName, folder]) => {
              const fullPath = basePath ? `${basePath}/${folderName}` : folderName
              if (expandedState[fullPath] !== undefined) {
                folder.expanded = expandedState[fullPath]
              }
              traverse(folder.subfolders, fullPath)
            })
          }
          traverse(structure)
          return { ...structure }
        }
        return restoreExpandedState(prevStructure)
      })
    }, 100)
    
    // 清除拖拽状态
    setIsDragging(false)
    setDraggedItem(null)
    setDragOverFolder('')
    setIsMoveDialogOpen(false)
    setMovingDiagram(null)
    setSelectedFolderForMove('')
  }

  /**
   * 重命名文件夹
   */
  const handleRenameFolder = () => {
    if (!renamingItem || !newName.trim()) return
    
    const oldPath = renamingItem.path
    const pathParts = oldPath.split('/')
    pathParts[pathParts.length - 1] = newName.trim()
    const newPath = pathParts.join('/')
    
    // 检查新名称是否已存在
    const existingPaths = getAllFolderPaths()
    if (existingPaths.includes(newPath)) {
      alert('文件夹名称已存在')
      return
    }
    
    // 更新文件夹路径
    const savedFolders = localStorage.getItem('mermaid-folders')
    if (savedFolders) {
      const folders = JSON.parse(savedFolders)
      const newFolders = folders.map((f: string) => {
        if (f === oldPath) return newPath
        if (f.startsWith(oldPath + '/')) return f.replace(oldPath + '/', newPath + '/')
        return f
      })
      localStorage.setItem('mermaid-folders', JSON.stringify(newFolders))
    }
    
    // 更新图表的文件夹路径
    const newDiagrams = diagrams.map(d => {
      if (d.folder === oldPath) {
        return { ...d, folder: newPath, updatedAt: new Date().toISOString() }
      }
      if (d.folder?.startsWith(oldPath + '/')) {
        return { ...d, folder: d.folder.replace(oldPath + '/', newPath + '/'), updatedAt: new Date().toISOString() }
      }
      return d
    })
    saveDiagramsToStorage(newDiagrams)
    
    setIsRenameDialogOpen(false)
    setRenamingItem(null)
    setNewName('')
  }

  /**
   * 在指定文件夹下创建子文件夹
   */
  const handleCreateSubFolder = (parentPath: string) => {
    setCurrentFolder(parentPath)
    setIsFolderDialogOpen(true)
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

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }
    
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 标题栏 */}
      <div className="flex-shrink-0 px-4 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">保存的图表</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-auto text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => setIsFolderDialogOpen(true)}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索图表..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors"
          />
        </div>
      </div>
      
      {/* 目录树 */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchTerm ? (
          // 搜索结果
          <div className="space-y-2">
            {filteredDiagrams.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">没有找到匹配的图表</p>
              </div>
            ) : (
              filteredDiagrams.map((diagram) => renderDiagramItem(diagram))
            )}
          </div>
        ) : (
          // 目录树结构
          <div 
            className="space-y-1 min-h-[200px]"
            onDragOver={(e) => {
              e.preventDefault()
              if (draggedItem && draggedItem.type === 'diagram') {
                e.dataTransfer.dropEffect = 'move'
                // 只有当拖拽到空白区域时才设置为root
                const target = e.target as HTMLElement
                if (target === e.currentTarget || target.closest('.space-y-1') === e.currentTarget) {
                  setDragOverFolder('root')
                }
              }
            }}
            onDragLeave={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX
              const y = e.clientY
              if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                setDragOverFolder('')
              }
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Dropping diagram:', draggedItem?.id, 'to root')
              setDragOverFolder('')
              if (draggedItem && draggedItem.type === 'diagram') {
                handleMoveDiagram(draggedItem.id, '')
              }
              setDraggedItem(null)
              setIsDragging(false)
            }}
          >
            {/* 根目录图表 */}
            <div className="mb-4">
              {getRootDiagrams().length > 0 && (
                <div className="text-xs text-gray-500 mb-2 px-3">根目录</div>
              )}
              {getRootDiagrams().map((diagram) => renderDiagramItem(diagram))}
            </div>
            
            {/* 文件夹树 */}
            {renderFolderTreeWithDiagrams(folderStructure)}
          </div>
        )}
      </div>
      
      {/* 重命名对话框 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>重命名文件夹</DialogTitle>
            <DialogDescription>
              重命名文件夹 "{renamingItem?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                新名称
              </Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                placeholder="输入新的文件夹名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRenameFolder}>
              重命名
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移动图表对话框 */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>移动图表</DialogTitle>
            <DialogDescription>
              将图表 "{movingDiagram?.name}" 移动到其他文件夹
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target-folder" className="text-right">
                目标文件夹
              </Label>
              <select
                id="target-folder"
                value={selectedFolderForMove}
                onChange={(e) => setSelectedFolderForMove(e.target.value)}
                className="col-span-3 w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
              >
                <option value="">根目录</option>
                {getAllFolderPaths().map(path => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => movingDiagram && handleMoveDiagram(movingDiagram.id, selectedFolderForMove)}>
              移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建文件夹对话框 */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">创建文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName" className="text-sm font-medium text-gray-700 mb-2 block">
                文件夹名称
              </Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="请输入文件夹名称"
                className="border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>
            {currentFolder && (
              <div className="text-sm text-gray-500">
                将在 <span className="font-medium">{currentFolder}</span> 中创建
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsFolderDialogOpen(false)
                  setNewFolderName('')
                }}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                取消
              </Button>
              <Button 
                onClick={handleCreateFolder}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.type === 'diagram' && (
            <>
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  handleEditDiagram(contextMenu.item as SavedDiagram)
                  setContextMenu(null)
                }}
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
              <button
                 className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                 onClick={() => {
                   setMovingDiagram(contextMenu.item as SavedDiagram)
                   setIsMoveDialogOpen(true)
                   setContextMenu(null)
                 }}
               >
                 <Move className="w-4 h-4" />
                 移动
               </button>
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
                onClick={() => {
                  handleDeleteDiagram((contextMenu.item as SavedDiagram).id)
                  setContextMenu(null)
                }}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </>
          )}
          {contextMenu.type === 'folder' && (
            <>
              <button
                 className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                 onClick={() => {
                   const item = contextMenu.item as any
                   setRenamingItem({ type: 'folder', path: item.path, name: item.name })
                   setNewName(item.name)
                   setIsRenameDialogOpen(true)
                   setContextMenu(null)
                 }}
               >
                 <Edit3 className="w-4 h-4" />
                 重命名
               </button>
               <button
                 className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                 onClick={() => {
                   const item = contextMenu.item as any
                   handleCreateSubFolder(item.path)
                   setContextMenu(null)
                 }}
               >
                 <FolderPlus className="w-4 h-4" />
                 创建子文件夹
               </button>
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
                onClick={() => {
                  handleDeleteFolder((contextMenu.item as any).path)
                  setContextMenu(null)
                }}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </>
          )}
        </div>
      )}
      
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
              <div>
                <Label htmlFor="folder" className="text-sm font-medium text-gray-700 mb-2 block">
                  所属文件夹
                </Label>
                <select
                  id="folder"
                  value={editingDiagram.folder || ''}
                  onChange={(e) => setEditingDiagram({
                    ...editingDiagram,
                    folder: e.target.value || undefined
                  })}
                  className="w-full px-3 py-2 text-sm border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-md transition-colors"
                >
                  <option value="">根目录</option>
                  {getAllFolderPaths().map(path => (
                    <option key={path} value={path}>{path}</option>
                  ))}
                </select>
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
