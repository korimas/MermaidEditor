# Mermaider 部署指南

本文档介绍如何构建和部署Mermaider项目，包括SEO优化配置。

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

开发服务器将在 `http://localhost:8000` 启动，支持热重载和实时预览。

### 生产构建

```bash
# 构建生产版本
yarn build
```

构建完成后，所有文件将输出到 `dist/` 目录，包括：

- `index.html` - 主页面（包含SEO优化标签）
- `main.js` - 打包后的JavaScript代码
- `main.css` - 打包后的CSS样式
- `robots.txt` - 搜索引擎爬虫指引
- `sitemap.xml` - 网站地图

## 📁 构建产物说明

### SEO优化文件

构建过程会自动将以下SEO优化文件复制到dist目录：

#### robots.txt
- 指导搜索引擎爬虫如何索引网站
- 允许主要搜索引擎访问
- 禁止访问源码目录
- 包含sitemap.xml位置

#### sitemap.xml
- 网站地图，帮助搜索引擎发现页面
- 包含主要页面和模板页面
- 设置了合理的更新频率和优先级

#### index.html SEO标签
- **Meta标签**: 标题、描述、关键词
- **Open Graph**: 社交媒体分享优化
- **Twitter Cards**: Twitter分享优化
- **结构化数据**: JSON-LD格式的应用信息
- **Canonical链接**: 避免重复内容

## 🌐 部署选项

### 1. 静态网站托管

#### Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Netlify
```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# 构建项目
yarn build

# 将dist目录内容推送到gh-pages分支
gh-pages -d dist
```

### 2. 传统Web服务器

#### Nginx配置示例

```nginx
server {
    listen 80;
    server_name mermaider.online www.mermaider.online;
    root /var/www/mermaider/dist;
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # SEO文件
    location = /robots.txt {
        add_header Content-Type text/plain;
    }

    location = /sitemap.xml {
        add_header Content-Type application/xml;
    }
}
```

#### Apache配置示例

```apache
<VirtualHost *:80>
    ServerName mermaider.online
    DocumentRoot /var/www/mermaider/dist
    
    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
    </Location>
    
    # 缓存控制
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
    
    # SPA路由支持
    <Directory "/var/www/mermaider/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## 🔧 构建配置

### 自定义构建脚本

构建脚本位于 `scripts/build.mjs`，主要功能：

1. **清理输出目录**: 删除旧的构建文件
2. **ESBuild打包**: 编译TypeScript和React代码
3. **样式处理**: Tailwind CSS + PostCSS处理
4. **SEO文件复制**: 自动复制robots.txt和sitemap.xml
5. **开发服务器**: 支持热重载的开发环境

### 环境变量

可以通过环境变量自定义构建行为：

```bash
# 生产构建
NODE_ENV=production yarn build

# 开发模式
NODE_ENV=development yarn dev
```

## 📊 性能优化

### 构建优化
- **Tree Shaking**: 移除未使用的代码
- **代码分割**: 按需加载组件
- **压缩**: 生产环境自动压缩JS/CSS
- **Source Map**: 开发环境生成调试信息

### 运行时优化
- **懒加载**: 图表按需渲染
- **缓存**: 合理的HTTP缓存策略
- **CDN**: 建议使用CDN加速静态资源

## 🔍 SEO检查清单

部署前请确认以下SEO配置：

- [ ] `robots.txt` 文件存在且配置正确
- [ ] `sitemap.xml` 文件存在且包含所有页面
- [ ] HTML包含完整的meta标签
- [ ] Open Graph标签配置正确
- [ ] 结构化数据格式正确
- [ ] 页面标题和描述唯一且描述性强
- [ ] 图片包含alt属性
- [ ] 页面加载速度优化

## 🚨 常见问题

### Q: 构建失败，提示权限错误
A: 在Windows上可能遇到PowerShell执行策略问题，使用 `cmd /c yarn build` 代替 `yarn build`

### Q: SEO文件没有复制到dist目录
A: 确保项目根目录存在 `robots.txt` 和 `sitemap.xml` 文件

### Q: 部署后页面刷新404
A: 需要配置服务器支持SPA路由，将所有请求重定向到 `index.html`

### Q: 搜索引擎无法索引
A: 检查robots.txt配置，确保没有禁止搜索引擎访问

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看构建日志确认错误信息
2. 检查服务器配置是否正确
3. 验证SEO文件是否正确生成
4. 提交Issue到项目仓库

---

**祝您部署顺利！** 🎉