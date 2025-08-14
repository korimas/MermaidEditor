import * as esbuild from 'esbuild'
import { rimraf } from 'rimraf'
import stylePlugin from 'esbuild-style-plugin'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'

const args = process.argv.slice(2)
const isProd = args[0] === '--production'

await rimraf('dist')

// copy files from dist to docs
function copyDistFilesToDocs() {
  const distDir = join(process.cwd(), 'dist')
  const docsDir = join(process.cwd(), 'docs')
  
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true })
  }
  
  exec(`cp -r ${distDir}/* ${docsDir}`)
}

/**
 * 复制SEO优化文件到dist目录
 */
function copySEOFiles() {
  const seoFiles = ['robots.txt']
  
  // 确保dist目录存在
  const distDir = join(process.cwd(), 'dist')
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true })
  }
  
  seoFiles.forEach(file => {
    const srcPath = join(process.cwd(), file)
    const destPath = join(process.cwd(), 'dist', file)
    
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath)
      console.log(`✓ 已复制 ${file} 到 dist 目录`)
    } else {
      console.warn(`⚠ 未找到 ${file} 文件`)
    }
  })
}

/**
 * @type {esbuild.BuildOptions}
 */
const esbuildOpts = {
  color: true,
  entryPoints: ['src/main.tsx', 'index.html'],
  outdir: 'dist',
  entryNames: '[name]',
  write: true,
  bundle: true,
  format: 'iife',
  sourcemap: isProd ? false : 'linked',
  minify: isProd,
  treeShaking: true,
  jsx: 'automatic',
  loader: {
    '.html': 'copy',
    '.png': 'file',
  },
  external: ['mermaid'],
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    }),
  ],
}

if (isProd) {
  await esbuild.build(esbuildOpts)
  // 生产构建完成后复制SEO文件
  copySEOFiles()
  copyDistFilesToDocs()
  console.log('🚀 生产构建完成！')
} else {
  const ctx = await esbuild.context(esbuildOpts)
  await ctx.watch()
  const { hosts, port } = await ctx.serve({
    port: 9000,
    host: 'localhost'
  })
  
  // 开发模式下也复制SEO文件
  copySEOFiles()
  
  const serverUrl = `http://localhost:${port}`
  console.log(`Running on: ${serverUrl}`)
  
  // 自动打开浏览器
  const openCommand = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open'
  
  exec(`${openCommand} ${serverUrl}`, (error) => {
    if (error) {
      console.log('无法自动打开浏览器，请手动访问:', serverUrl)
    } else {
      console.log('🚀 浏览器已自动打开！')
    }
  })
}
