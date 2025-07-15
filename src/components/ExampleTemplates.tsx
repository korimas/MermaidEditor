/**
 * Mermaid 示例模板组件
 * 提供常用的 Mermaid 图表模板
 */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ExampleTemplatesProps {
  onSelectTemplate: (code: string) => void
  className?: string
}

export default function ExampleTemplates({ onSelectTemplate, className = '' }: ExampleTemplatesProps) {
  const templates = [
    {
      name: '流程图',
      description: '基础流程图示例',
      code: `graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E`
    },
    {
      name: '时序图',
      description: '用户登录时序图',
      code: `sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库
    
    U->>F: 输入用户名密码
    F->>B: 发送登录请求
    B->>D: 验证用户信息
    D-->>B: 返回验证结果
    B-->>F: 返回登录状态
    F-->>U: 显示登录结果`
    },
    {
      name: '类图',
      description: '简单类图示例',
      code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    class Cat {
        +String color
        +meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`
    },
    {
      name: '饼图',
      description: '数据分布饼图',
      code: `pie title 编程语言使用情况
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "TypeScript" : 15
    "其他" : 5`
    },
    {
      name: '甘特图',
      description: '项目进度甘特图',
      code: `gantt
    title 项目开发进度
    dateFormat YYYY-MM-DD
    section 设计阶段
    需求分析 :a1, 2024-01-01, 30d
    UI设计 :after a1, 20d
    section 开发阶段
    前端开发 :2024-02-01, 45d
    后端开发 :2024-02-01, 45d
    section 测试阶段
    单元测试 :2024-03-15, 15d
    集成测试 :2024-03-20, 10d`
    },
    {
      name: '状态图',
      description: '订单状态流转图',
      code: `stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付: 支付成功
    待支付 --> 已取消: 超时/用户取消
    已支付 --> 已发货: 商家发货
    已发货 --> 已收货: 用户确认收货
    已收货 --> 已完成: 自动完成
    已支付 --> 已退款: 退款申请
    已取消 --> [*]
    已完成 --> [*]
    已退款 --> [*]`
    }
  ]

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">示例图表</h3>
          <p className="text-xs text-gray-500">选择一个模板快速开始</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer hover:shadow-sm border border-gray-200 bg-white hover:bg-gray-50"
              onClick={() => onSelectTemplate(template.code)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 flex items-center justify-center">
                    {index === 0 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    {index === 1 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {index === 2 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                    {index === 3 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /></svg>}
                    {index === 4 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    {index === 5 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  使用模板
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
