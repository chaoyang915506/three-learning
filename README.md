# Three.js Learning Demo

这是一个基于 Vue 3 + Three.js 的 3D 场景演示项目，主要展示了不同的 Three.js 渲染和导出功能。

## 在线预览

[在线 Demo](https://chaoyang915506.github.io/three-learning/)

## 项目特点

### 1. 多场景展示
- **场景1**: CSS Renderer 导出功能
- **场景2**: 3D 实体导出功能
- **场景3**: 球体场景
- **场景4**: HTML 导出功能

### 2. 智能侧边栏
- 可折叠导航菜单
- 实时搜索功能
- 搜索历史记录
- 快捷键支持（按 '/' 聚焦搜索框）

### 3. 导出功能
- SVG 导出
- CSS2D 元素导出
- HTML 内容导出

### 4. 交互特性
- 3D 场景交互
- 轨道控制器
- 实时渲染
- 响应式设计

## 技术栈

- Vue 3
- Three.js
- Vue Router
- Vite
- Lodash

## 项目结构

```
three-learning/
├── src/
│   ├── components/
│   │   ├── ThreeScene.vue      # 场景1组件
│   │   ├── ThreeScene2.vue     # 场景2组件
│   │   ├── Sidebar.vue         # 侧边栏组件
│   │   └── ThreeExportSVG.md   # 导出文档
│   ├── router/
│   │   └── index.js            # 路由配置
│   ├── assets/
│   │   └── icon/               # 图标资源
│   ├── App.vue                 # 根组件
│   └── main.js                 # 入口文件
├── public/
├── vite.config.js              # Vite配置
└── package.json
```

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/chaoyang915506/three-learning.git
```

2. 安装依赖
```bash
cd three-learning
npm install
```

3. 本地运行
```bash
npm run dev
```

4. 打包构建
```bash
npm run build
```

## 功能说明

### 场景1 - CSS Renderer 导出
- 支持 CSS2D 元素导出
- 可导出为 SVG 或 PNG 格式
- 保持样式和布局

### 场景2 - 实体导出
- 支持 3D 模型导出
- 线段和几何体导出
- SVG 格式保存

### 场景3 - 球体场景
- 3D 球体渲染
- 材质和光照效果
- 交互控制

### 场景4 - HTML 导出
- HTML 元素导出
- 保持原有样式
- 支持多种格式

## 贡献

欢迎提交 Issue 和 Pull Request

## 许可

[MIT License](LICENSE)