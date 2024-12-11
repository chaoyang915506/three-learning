# Three.js 导出 SVG 技术方案

## 1. 概述

在 Three.js 项目中，我们经常需要将 3D 场景导出为 SVG 格式。本文将介绍三种不同的导出方案：
- 完整场景导出为 SVG
- CSS2D 元素导出为 PNG
- CSS2D 元素导出为 SVG

## 2. 完整场景导出 SVG

### 2.1 基本原理
使用 Three.js 提供的 SVGRenderer 将整个 3D 场景渲染为 SVG 格式。

### 2.2 核心代码

```javascript
const exportToSVG = () => {
  // 创建临时场景用于 SVG 导出
  const tempScene = new THREE.Scene();
  tempScene.background = scene.background;

  // 克隆所有 3D 对象
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      const clonedObject = object.clone();
      tempScene.add(clonedObject);
    }
  });

  // 创建 SVG 渲染器
  const svgRenderer = new SVGRenderer();
  svgRenderer.setSize(window.innerWidth, window.innerHeight);
  svgRenderer.render(tempScene, camera);

  // 导出 SVG
  const svgContent = svgRenderer.domElement.outerHTML;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'scene.svg';
  link.href = url;
  link.click();

  // 清理资源
  URL.revokeObjectURL(url);
  svgRenderer = null;
}
```

### 2.3 关键点说明
- 创建临时场景避免污染原场景
- 克隆对象而不是直接使用
- 注意内存清理
- 处理材质和纹理

## 3. CSS2D 元素导出 PNG

### 3.1 基本原理
使用 html2canvas 库捕获 CSS2D 渲染器的 DOM 输出。

### 3.2 核心代码
```javascript
const captureCSS2D = () => {
  // 获取 CSS2D 容器
  const css2dContainer = labelRenderer.domElement;

  // 创建临时容器
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.backgroundColor = 'transparent';
  container.appendChild(css2dContainer.cloneNode(true));

  // 使用 html2canvas 捕获
  html2canvas(container, {
    backgroundColor: null,
    scale: window.devicePixelRatio,
    logging: false,
    allowTaint: true,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'css2d-elements.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}
```

### 3.3 注意事项
- 设置正确的背景透明度
- 处理设备像素比
- 确保元素可见性
- 处理跨域资源

## 4. CSS2D 元素导出 SVG

### 4.1 基本原理
将 CSS2D 元素转换为纯 SVG 格式，包括文本、图标等。

### 4.2 核心代码
```javascript
const exportCSS2DSVG = () => {
  // 创建 SVG 根元素
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);

  // 处理 iconfont 图标
  const iconElements = document.querySelectorAll('.iconfont');
  iconElements.forEach(icon => {
    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "图标的 SVG 路径数据");
    path.setAttribute("fill", "#75f9fd");
    iconSvg.appendChild(path);
    icon.parentNode.replaceChild(iconSvg, icon);
  });

  // 导出处理后的 SVG
  const svgContent = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "css2d-elements.svg";
  link.href = url;
  link.click();
}
```

### 4.3 技术要点
- 正确处理 SVG 命名空间
- 转换 iconfont 为 SVG path
- 保持样式和置信息
- 处理文本和特殊字符

## 5. 性能优化

### 5.1 大场景处理
- 分批处理大量对象
- 使用 Web Worker
- 添加进度提示

### 5.2 内存管理
- 及时清理临时对象
- 避免内存泄漏
- 使用对象池

### 5.3 渲染优化
- 优化场景层级
- 简化材质和几何体
- 使用 LOD (Level of Detail)

## 6. 兼容性考虑

### 6.1 浏览器支持
- 检查 SVG 支持
- 处理不同浏览器差异
- 提供降级方案

### 6.2 设备适配
- 处理高 DPI 显示器
- 移动设备兼容
- 触摸事件支持

## 7. 最佳实践

1. 导出前进行场景优化
2. 提供用户反馈和进度提示
3. 处理错误和异常情况
4. 正确清理资源
5. 提供预览功能

## 8. 常见问题

### 8.1 SVG 导出问题
- 材质渲染不正确
- 文字显示异常
- 图标缺失

### 8.2 解决方案
- 检查渲染器设置
- 确保资源加载完成
- 验证 DOM 结构

## 9. 参考资料

- [Three.js 官方文档](https://threejs.org/docs/)
- [SVGRenderer 文档](https://threejs.org/docs/#examples/en/renderers/SVGRenderer)
- [html2canvas 文档](https://html2canvas.hertzen.com/)
- [MDN SVG 文档](https://developer.mozilla.org/en-US/docs/Web/SVG)
EOL