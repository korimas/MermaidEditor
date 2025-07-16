/**
 * Mermaid 示例模板组件
 * 提供各种类型的图表模板供用户选择
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Eye, FileText, GitBranch, Users, BarChart3, Calendar, Brain, Network } from 'lucide-react'

interface ExampleTemplatesProps {
  onSelectTemplate: (code: string) => void
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  code: string
  preview?: string
}

export default function ExampleTemplates({ onSelectTemplate }: ExampleTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  /**
   * 模板数据定义
   */
  const templates: Template[] = [
    // 流程图模板
    {
      id: 'flowchart-basic',
      name: '基础流程图',
      description: '简单的决策流程图',
      category: 'flowchart',
      icon: <FileText className="w-4 h-4" />,
      code: `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E`
    },
    {
      id: 'flowchart-process',
      name: '业务流程图',
      description: '复杂的业务处理流程',
      category: 'flowchart',
      icon: <FileText className="w-4 h-4" />,
      code: `flowchart TD
    Start([开始]) --> Input[输入数据]
    Input --> Validate{数据验证}
    Validate -->|通过| Process[处理数据]
    Validate -->|失败| Error[错误处理]
    Process --> Save[(保存到数据库)]
    Save --> Success[成功响应]
    Error --> End([结束])
    Success --> End`
    },
    {
      id: 'flowchart-user-register',
      name: '用户注册流程',
      description: '完整的用户注册业务流程',
      category: 'flowchart',
      icon: <FileText className="w-4 h-4" />,
      code: `flowchart TD
    Start([用户访问注册页面]) --> Input[填写注册信息]
    Input --> Validate{表单验证}
    Validate -->|格式错误| Error1[显示错误提示]
    Error1 --> Input
    Validate -->|格式正确| CheckUser{检查用户是否存在}
    CheckUser -->|已存在| Error2[提示用户已存在]
    Error2 --> Input
    CheckUser -->|不存在| CreateUser[创建用户账户]
    CreateUser --> SendEmail[发送验证邮件]
    SendEmail --> Success[注册成功提示]
    Success --> Login[跳转登录页面]
    Login --> End([结束])`
    },
    {
      id: 'flowchart-payment',
      name: '支付流程图',
      description: '电商支付处理流程',
      category: 'flowchart',
      icon: <FileText className="w-4 h-4" />,
      code: `flowchart TD
    Start([发起支付]) --> SelectPay[选择支付方式]
    SelectPay --> Validate{验证支付信息}
    Validate -->|失败| Error[支付失败]
    Validate -->|成功| CallPay[调用支付接口]
    CallPay --> PayGateway{支付网关处理}
    PayGateway -->|成功| Success[支付成功]
    PayGateway -->|失败| Retry{是否重试}
    Retry -->|是| CallPay
    Retry -->|否| Error
    Success --> UpdateOrder[更新订单状态]
    UpdateOrder --> SendNotice[发送通知]
    SendNotice --> End([完成])
    Error --> End`
    },
    {
      id: 'flowchart-cicd',
      name: 'CI/CD流程',
      description: '持续集成和部署流程',
      category: 'flowchart',
      icon: <FileText className="w-4 h-4" />,
      code: `flowchart TD
    Start([代码提交]) --> Trigger[触发CI/CD]
    Trigger --> Build[构建项目]
    Build --> Test{运行测试}
    Test -->|失败| Notify1[通知失败]
    Test -->|成功| Deploy{部署环境}
    Deploy -->|测试环境| TestDeploy[测试环境部署]
    Deploy -->|生产环境| ProdDeploy[生产环境部署]
    TestDeploy --> Verify[验证部署]
    ProdDeploy --> Verify
    Verify -->|失败| Rollback[回滚版本]
    Verify -->|成功| Success[部署成功]
    Rollback --> Notify2[通知回滚]
    Success --> Notify3[通知成功]
    Notify1 --> End([结束])
    Notify2 --> End
    Notify3 --> End`
    },
    {
      id: 'flowchart-error-handling',
      name: '错误处理流程',
      description: '系统错误处理和恢复机制',
      category: 'flowchart',
      icon: <FileText className="w-4 h-4" />,
      code: `flowchart TD
    Start([检测到错误]) --> Classify{错误分类}
    Classify -->|系统错误| SysError[系统错误处理]
    Classify -->|业务错误| BizError[业务错误处理]
    Classify -->|网络错误| NetError[网络错误处理]
    
    SysError --> Log1[记录错误日志]
    BizError --> Log2[记录业务日志]
    NetError --> Retry{重试机制}
    
    Retry -->|重试成功| Success[处理成功]
    Retry -->|重试失败| Log3[记录网络错误]
    
    Log1 --> Alert1[发送告警]
    Log2 --> Response1[返回错误响应]
    Log3 --> Alert2[发送网络告警]
    
    Alert1 --> End([结束])
    Alert2 --> End
    Response1 --> End
    Success --> End`
    },
    
    // 序列图模板
    {
      id: 'sequence-basic',
      name: '基础序列图',
      description: '用户登录序列图',
      category: 'sequence',
      icon: <Users className="w-4 h-4" />,
      code: `sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库
    
    U->>F: 输入用户名密码
    F->>B: 发送登录请求
    B->>D: 查询用户信息
    D-->>B: 返回用户数据
    B-->>F: 返回登录结果
    F-->>U: 显示登录状态`
    },
    {
      id: 'sequence-api',
      name: 'API调用序列',
      description: '微服务API调用链路',
      category: 'sequence',
      icon: <Users className="w-4 h-4" />,
      code: `sequenceDiagram
    participant C as 客户端
    participant G as API网关
    participant A as 认证服务
    participant B as 业务服务
    participant D as 数据库
    participant R as Redis
    
    C->>G: 发送API请求
    G->>A: 验证Token
    A->>R: 检查Token缓存
    R-->>A: 返回Token状态
    A-->>G: 返回验证结果
    G->>B: 转发业务请求
    B->>D: 查询业务数据
    D-->>B: 返回数据
    B->>R: 缓存结果
    B-->>G: 返回业务结果
    G-->>C: 返回API响应`
    },
    {
      id: 'sequence-payment',
      name: '支付交互序列',
      description: '第三方支付交互流程',
      category: 'sequence',
      icon: <Users className="w-4 h-4" />,
      code: `sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant P as 支付网关
    participant T as 第三方支付
    
    U->>F: 点击支付
    F->>B: 创建支付订单
    B->>P: 请求支付
    P->>T: 调用支付接口
    T-->>P: 返回支付链接
    P-->>B: 返回支付信息
    B-->>F: 返回支付页面
    F-->>U: 跳转支付页面
    
    U->>T: 完成支付
    T->>P: 支付通知
    P->>B: 支付回调
    B->>B: 更新订单状态
    B-->>F: 推送支付结果
    F-->>U: 显示支付成功`
    },
    {
      id: 'sequence-message',
      name: '消息队列处理',
      description: '异步消息处理序列',
      category: 'sequence',
      icon: <Users className="w-4 h-4" />,
      code: `sequenceDiagram
    participant P as 生产者
    participant Q as 消息队列
    participant C1 as 消费者1
    participant C2 as 消费者2
    participant D as 数据库
    
    P->>Q: 发送消息
    Q->>C1: 分发消息
    Q->>C2: 分发消息
    
    C1->>D: 处理业务1
    D-->>C1: 返回结果
    C1->>Q: 确认消息
    
    C2->>D: 处理业务2
    D-->>C2: 返回结果
    C2->>Q: 确认消息
    
    Q-->>P: 处理完成通知`
    },
    
    // 类图模板
    {
      id: 'class-basic',
      name: '基础类图',
      description: '面向对象类关系图',
      category: 'class',
      icon: <Network className="w-4 h-4" />,
      code: `classDiagram
    class Animal{
        +String name
        +int age
        +eat()
        +sleep()
    }
    class Dog{
        +String breed
        +bark()
    }
    class Cat{
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
    },
    {
      id: 'class-user-system',
      name: '用户系统类图',
      description: '用户管理系统设计',
      category: 'class',
      icon: <Network className="w-4 h-4" />,
      code: `classDiagram
    class User{
        -Long id
        -String username
        -String email
        -String password
        +login()
        +logout()
        +updateProfile()
    }
    class Role{
        -Long id
        -String name
        -String description
        +getPermissions()
    }
    class Permission{
        -Long id
        -String name
        -String resource
        -String action
    }
    User ||--o{ Role
    Role ||--o{ Permission`
    },
    {
      id: 'class-ecommerce',
      name: '电商系统类图',
      description: '电商核心业务模型',
      category: 'class',
      icon: <Network className="w-4 h-4" />,
      code: `classDiagram
    class Customer{
        -Long id
        -String name
        -String email
        -String phone
        +placeOrder()
        +viewOrders()
    }
    class Product{
        -Long id
        -String name
        -BigDecimal price
        -Integer stock
        +updateStock()
        +getPrice()
    }
    class Order{
        -Long id
        -Long customerId
        -Date orderDate
        -BigDecimal totalAmount
        -String status
        +calculateTotal()
        +updateStatus()
    }
    class OrderItem{
        -Long id
        -Long orderId
        -Long productId
        -Integer quantity
        -BigDecimal price
    }
    Customer ||--o{ Order
    Order ||--o{ OrderItem
    Product ||--o{ OrderItem`
    },
    {
      id: 'class-simple',
      name: '简单类图',
      description: '最基础的类图示例',
      category: 'class',
      icon: <Network className="w-4 h-4" />,
      code: `classDiagram
    class Vehicle{
        +String brand
        +String model
        +int year
        +start()
        +stop()
    }
    class Car{
        +int doors
        +String fuelType
        +drive()
    }
    class Motorcycle{
        +boolean hasSidecar
        +ride()
    }
    Vehicle <|-- Car
    Vehicle <|-- Motorcycle`
    },
    
    // 状态图模板
    {
      id: 'state-basic',
      name: '基础状态图',
      description: '系统状态转换图',
      category: 'state',
      icon: <GitBranch className="w-4 h-4" />,
      code: `stateDiagram-v2
    [*] --> 待机
    待机 --> 工作 : 启动
    工作 --> 暂停 : 暂停命令
    暂停 --> 工作 : 恢复命令
    工作 --> 停止 : 停止命令
    暂停 --> 停止 : 停止命令
    停止 --> [*]`
    },
    {
      id: 'state-order',
      name: '订单状态图',
      description: '电商订单状态流转',
      category: 'state',
      icon: <GitBranch className="w-4 h-4" />,
      code: `stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已取消 : 取消订单
    待支付 --> 已支付 : 完成支付
    已支付 --> 备货中 : 自动转换
    备货中 --> 已发货 : 发货操作
    已发货 --> 已签收 : 用户签收
    已签收 --> 已完成 : 系统确认
    已签收 --> 售后中 : 申请售后
    售后中 --> 已退款 : 退款处理
    售后中 --> 已完成 : 取消售后
    已取消 --> [*]
    已完成 --> [*]
    已退款 --> [*]`
    },
    {
      id: 'state-user-session',
      name: '用户会话状态',
      description: '用户登录会话管理',
      category: 'state',
      icon: <GitBranch className="w-4 h-4" />,
      code: `stateDiagram-v2
    [*] --> 未登录
    未登录 --> 登录中 : 开始登录
    登录中 --> 未登录 : 登录失败
    登录中 --> 已登录 : 登录成功
    已登录 --> 活跃 : 用户操作
    已登录 --> 空闲 : 无操作
    空闲 --> 活跃 : 用户操作
    空闲 --> 即将过期 : 超时警告
    即将过期 --> 活跃 : 用户操作
    即将过期 --> 已过期 : 会话过期
    已过期 --> 未登录 : 清除会话
    已登录 --> 登出中 : 主动登出
    活跃 --> 登出中 : 主动登出
    登出中 --> 未登录 : 登出完成`
    },
    {
      id: 'state-device',
      name: '设备状态管理',
      description: 'IoT设备状态控制',
      category: 'state',
      icon: <GitBranch className="w-4 h-4" />,
      code: `stateDiagram-v2
    [*] --> 离线
    离线 --> 连接中 : 设备上线
    连接中 --> 在线 : 连接成功
    连接中 --> 离线 : 连接失败
    在线 --> 工作中 : 启动设备
    工作中 --> 暂停 : 暂停命令
    暂停 --> 工作中 : 恢复命令
    工作中 --> 在线 : 停止工作
    在线 --> 维护中 : 进入维护
    维护中 --> 在线 : 维护完成
    在线 --> 故障 : 设备异常
    故障 --> 维护中 : 开始维修
    故障 --> 在线 : 自动恢复
    在线 --> 离线 : 设备下线
    工作中 --> 离线 : 异常断线
    故障 --> 离线 : 设备损坏`
    },
    
    // 甘特图模板
    {
      id: 'gantt-basic',
      name: '项目甘特图',
      description: '项目管理时间线',
      category: 'gantt',
      icon: <Calendar className="w-4 h-4" />,
      code: `gantt
    title 项目开发计划
    dateFormat YYYY-MM-DD
    section 需求分析
    需求收集     :done,    req1, 2024-01-01,2024-01-05
    需求分析     :done,    req2, after req1, 5d
    section 设计阶段
    系统设计     :active,  design1, 2024-01-10, 10d
    UI设计       :         design2, after design1, 8d
    section 开发阶段
    前端开发     :         dev1, 2024-01-25, 20d
    后端开发     :         dev2, 2024-01-25, 25d
    section 测试阶段
    单元测试     :         test1, after dev1, 5d
    集成测试     :         test2, after test1, 8d`
    },
    {
      id: 'gantt-product-launch',
      name: '产品发布计划',
      description: '新产品上线时间规划',
      category: 'gantt',
      icon: <Calendar className="w-4 h-4" />,
      code: `gantt
    title 产品发布计划
    dateFormat YYYY-MM-DD
    section 产品规划
    市场调研     :done,    research, 2024-01-01, 2024-01-15
    产品定义     :done,    define, after research, 10d
    竞品分析     :done,    competitor, 2024-01-10, 2024-01-20
    section 设计开发
    原型设计     :active,  prototype, 2024-01-20, 15d
    UI设计       :         design, after prototype, 12d
    前端开发     :         frontend, after design, 20d
    后端开发     :         backend, 2024-02-01, 25d
    section 测试验收
    功能测试     :         test1, after frontend, 8d
    性能测试     :         test2, after backend, 5d
    用户测试     :         test3, after test1, 10d
    section 发布上线
    灰度发布     :         gray, after test3, 3d
    正式发布     :         release, after gray, 1d
    监控优化     :         monitor, after release, 7d`
    },
    {
      id: 'gantt-sprint',
      name: '敏捷迭代计划',
      description: '两周Sprint开发计划',
      category: 'gantt',
      icon: <Calendar className="w-4 h-4" />,
      code: `gantt
    title Sprint开发计划
    dateFormat YYYY-MM-DD
    section Sprint1
    需求梳理     :done,    req1, 2024-01-01, 2024-01-02
    任务分解     :done,    task1, after req1, 1d
    开发工作     :active,  dev1, after task1, 8d
    测试工作     :         test1, after dev1, 2d
    Review      :         review1, after test1, 1d
    section Sprint2
    需求梳理     :         req2, 2024-01-15, 2024-01-16
    任务分解     :         task2, after req2, 1d
    开发工作     :         dev2, after task2, 8d
    测试工作     :         test2, after dev2, 2d
    Review      :         review2, after test2, 1d
    section Sprint3
    需求梳理     :         req3, 2024-01-29, 2024-01-30
    任务分解     :         task3, after req3, 1d
    开发工作     :         dev3, after task3, 8d
    测试工作     :         test3, after dev3, 2d
    Review      :         review3, after test3, 1d`
    },
    
    // 饼图模板
    {
      id: 'pie-basic',
      name: '数据分析饼图',
      description: '数据分布可视化',
      category: 'pie',
      icon: <BarChart3 className="w-4 h-4" />,
      code: `pie title 用户访问来源分布
    "直接访问" : 42.5
    "搜索引擎" : 28.3
    "社交媒体" : 15.2
    "邮件营销" : 8.7
    "其他" : 5.3`
    },
    {
      id: 'pie-market-share',
      name: '市场份额分析',
      description: '行业市场占有率',
      category: 'pie',
      icon: <BarChart3 className="w-4 h-4" />,
      code: `pie title 手机市场份额
    "苹果" : 28.5
    "三星" : 22.3
    "华为" : 18.7
    "小米" : 12.8
    "OPPO" : 8.9
    "vivo" : 6.2
    "其他" : 2.6`
    },
    {
      id: 'pie-budget',
      name: '预算分配图',
      description: '项目预算分配情况',
      category: 'pie',
      icon: <BarChart3 className="w-4 h-4" />,
      code: `pie title 项目预算分配
    "人力成本" : 45.8
    "技术投入" : 22.5
    "市场推广" : 15.3
    "运营成本" : 8.7
    "硬件设备" : 5.2
    "其他费用" : 2.5`
    },
    {
      id: 'pie-satisfaction',
      name: '用户满意度调研',
      description: '产品满意度统计',
      category: 'pie',
      icon: <BarChart3 className="w-4 h-4" />,
      code: `pie title 用户满意度调研
    "非常满意" : 35.6
    "满意" : 28.9
    "一般" : 20.1
    "不满意" : 10.3
    "非常不满意" : 5.1`
    },
    
    // 思维导图模板
    {
      id: 'mindmap-basic',
      name: '思维导图',
      description: '知识结构图',
      category: 'mindmap',
      icon: <Brain className="w-4 h-4" />,
      code: `mindmap
  root((前端技术栈))
    基础技术
      HTML
      CSS
      JavaScript
    框架库
      React
        Hooks
        Router
        状态管理
      Vue
        CompositionAPI
        Vuex
        VueRouter
    工具链
      构建工具
        Webpack
        Vite
        Rollup
      包管理
        NPM
        Yarn
        PNPM`
    },
    {
      id: 'mindmap-product',
      name: '产品规划思维导图',
      description: '产品功能规划结构',
      category: 'mindmap',
      icon: <Brain className="w-4 h-4" />,
      code: `mindmap
  root((产品规划))
    用户研究
      用户画像
        年龄分布
        使用习惯
        需求痛点
      用户调研
        问卷调查
        用户访谈
        竞品分析
    功能设计
      核心功能
        用户管理
        内容管理
        权限控制
      扩展功能
        数据统计
        消息通知
        API接口
    技术实现
      前端技术
        React
        TypeScript
        TailwindCSS
      后端技术
        NodeJS
        数据库
        缓存
    运营策略
      获客渠道
        SEO优化
        社媒推广
        合作伙伴
      用户留存
        产品体验
        用户反馈
        持续优化`
    },
    {
      id: 'mindmap-learning',
      name: '学习计划思维导图',
      description: '个人技能学习规划',
      category: 'mindmap',
      icon: <Brain className="w-4 h-4" />,
      code: `mindmap
  root((技能学习))
    编程语言
      前端
        JavaScript
        TypeScript
        CSS预处理器
      后端
        Python
        Java
        Go
      数据库
        MySQL
        Redis
        MongoDB
    框架工具
      前端框架
        React
        Vue
        Angular
      后端框架
        Express
        SpringBoot
        Django
      开发工具
        Git
        Docker
        Kubernetes
    软技能
      沟通能力
        技术分享
        团队协作
        需求理解
      项目管理
        敏捷开发
        时间管理
        风险控制
    学习方法
      理论学习
        文档阅读
        视频教程
        技术博客
      实践练习
        项目实战
        代码练习
        开源贡献`
    },
    {
      id: 'mindmap-architecture',
      name: '系统架构思维导图',
      description: '技术架构设计规划',
      category: 'mindmap',
      icon: <Brain className="w-4 h-4" />,
      code: `mindmap
  root((系统架构))
    前端架构
      框架选择
        React
        Vue
        Angular
      状态管理
        Redux
        Zustand
        Pinia
      构建工具
        Webpack
        Vite
        Rollup
    后端架构
      微服务
        服务拆分
        API网关
        服务发现
      数据层
        关系型数据库
        NoSQL数据库
        缓存系统
      中间件
        消息队列
        负载均衡
        限流熔断
    基础设施
      容器化
        Docker
        Kubernetes
        容器编排
      监控告警
        日志收集
        性能监控
        错误追踪
      CICD
        代码管理
        自动化测试
        部署流水线
    安全设计
      身份认证
        OAuth2
        JWT
        SSO
      数据安全
        数据加密
        访问控制
        安全审计`
    }
  ]

  /**
   * 按类别分组模板
   */
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  const categories = [
    { key: 'flowchart', label: '流程图', icon: <FileText className="w-4 h-4" /> },
    { key: 'sequence', label: '序列图', icon: <Users className="w-4 h-4" /> },
    { key: 'class', label: '类图', icon: <Network className="w-4 h-4" /> },
    { key: 'state', label: '状态图', icon: <GitBranch className="w-4 h-4" /> },
    { key: 'gantt', label: '甘特图', icon: <Calendar className="w-4 h-4" /> },
    { key: 'pie', label: '饼图', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'mindmap', label: '思维导图', icon: <Brain className="w-4 h-4" /> }
  ]

  /**
   * 处理模板选择
   */
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template.id)
    onSelectTemplate(template.code)
  }

  /**
   * 复制代码到剪贴板
   */
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Tabs defaultValue="flowchart" className="h-full flex flex-col bg-white">
      <div className="flex-shrink-0 px-6 py-5 bg-white border-b border-slate-200">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">示例模板</h2>
          <p className="text-sm text-slate-600">选择一个模板快速开始创建图表</p>
        </div>
        <div>
          <TabsList className="flex gap-0.5 bg-slate-100 p-0.5 h-auto w-full rounded-lg">
            {categories.map((category) => (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="text-xs py-2 px-1 flex flex-col items-center gap-1 font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 flex-1 justify-center transition-all duration-200 rounded-md min-w-0"
                title={category.label}
              >
                <span className="text-slate-500 data-[state=active]:text-slate-700 flex-shrink-0">{category.icon}</span>
                <span className="text-xs leading-none truncate w-full text-center">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="mt-0">
            <div className="p-6 space-y-4">
              {templatesByCategory[category.key]?.map((template) => (
                <Card
                  key={template.id}
                  className={`group cursor-pointer transition-all duration-200 border-slate-200 ${
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200' 
                      : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                          selectedTemplate === template.id 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-slate-900 mb-1.5">{template.name}</CardTitle>
                          <CardDescription className="text-sm text-slate-600 leading-relaxed">{template.description}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-auto text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyCode(template.code)
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`p-4 rounded-lg transition-all duration-200 ${
                      selectedTemplate === template.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-slate-50'
                    }`}>
                      <pre className="text-xs text-slate-700 overflow-hidden whitespace-pre-wrap font-mono leading-relaxed break-all">
                        {template.code.split('\n').slice(0, 4).join('\n')}
                        {template.code.split('\n').length > 4 && '\n...'}
                      </pre>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <Badge variant="secondary" className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${
                        selectedTemplate === template.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {category.label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs h-8 px-3 font-medium transition-all duration-200 rounded-md ${
                          selectedTemplate === template.id 
                            ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                            : 'border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectTemplate(template)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        使用模板
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
