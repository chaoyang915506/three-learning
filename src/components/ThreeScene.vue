<template>
  <div class="scene-container">
    <div id="three-container"></div>
    <div
      v-if="showTooltip"
      class="tooltip"
      :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
    >
      双击选中方块
    </div>

    <!-- 添加控制按钮 -->
    <div class="control-panel">
      <!-- <button class="export-btn" @click="exportToSVG">导出SVG</button> -->
      <button class="capture-btn" @click="exportCSS2DSVG">导出CSS SVG</button>
    
    </div>

    <!-- 选区蒙版 -->
    <div
      v-if="isSelecting"
      class="selection-mask"
      :style="{
        left: selectionPosition.x + 'px',
        top: selectionPosition.y + 'px',
        width: '500px',
        height: '300px',
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
      }"
      @mousedown="startDrag"
    >
      <div class="selection-border"></div>
    </div>

    <!-- 添加HTML模板 -->
    <div id="flag-template" style="display: none">
      <div class="flag">🚩</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from "vue";
import * as THREE from "three";
// import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// import { CSS2DRenderer,CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import html2canvas from "html2canvas";

const showTooltip = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const selectedCube = ref(null);

const isSelecting = ref(false);
const selectionPosition = ref({ x: 0, y: 0 });
const dragOffset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

let scene, camera, renderer, labelRenderer, raycaster, mouse;
const cubes = [];
let controls;

const cornerButtons = ref([
  { x: -4, y: 2, z: -2, label: "左上角", action: "操作1" },
  { x: 4, y: 2, z: -2, label: "右上角", action: "操作2" },
  { x: -4, y: -2, z: -2, label: "左下角", action: "操作3" },
  { x: 4, y: -2, z: -2, label: "右下角", action: "操作4" },
]);

const init = () => {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe6f3ff);

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("three-container").appendChild(renderer.domElement);

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 50;
  controls.maxPolarAngle = Math.PI / 2;

  // 设置初始状态
  controls.enabled = !isSelecting.value;

  // 添加CSS2D渲染器
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.left = "0";
  document
    .getElementById("three-container")
    .appendChild(labelRenderer.domElement);

  // 创建射线检测器
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 创建三个立方体
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });

  // 创建三个立方体并设置位置
  for (let i = 0; i < 3; i++) {
    const cube = new THREE.Mesh(cubeGeometry, material.clone());
    cube.position.x = (i - 1) * 2;
    scene.add(cube);
    cubes.push(cube);
  }

  // 添加环境光和平行光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 2);
  scene.add(directionalLight);

  // 添加线段
  const point1 = new THREE.Vector3(-3, 0, 0);
  const point2 = new THREE.Vector3(3, 0, 0);

  const lineGeometry = new LineGeometry();
  lineGeometry.setPositions([
    point1.x,
    point1.y,
    point1.z,
    point2.x,
    point2.y,
    point2.z,
  ]);

  const matLine = new LineMaterial({
    color: 0x000000,
    linewidth: 5, // 增加线宽
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    dashed: false,
    alphaToCoverage: true, // 添加这个属性以提高线的可见性
  });

  const line = new Line2(lineGeometry, matLine);
  line.computeLineDistances();
  scene.add(line);

  // 添加事件监听器
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("dblclick", onDoubleClick);
  window.addEventListener("resize", onWindowResize);

  // 添加四角按钮
  addCornerButtons();

  // 添加CSS圆形
  const circleContainer = document.createElement("div");
  circleContainer.className = "circle-container";

  const circle = document.createElement("div");
  circle.className = "circle";
  circle.textContent = "圆形";
  circle.style.display = "flex";
  circle.style.alignItems = "center";
  circle.style.justifyContent = "center";
  circle.style.color = "white";
  circle.style.fontSize = "20px";

  circleContainer.appendChild(circle);

  const circleLabel = new CSS2DObject(circleContainer);
  // 调整圆形位置，使其更靠近相机和视野中心
  circleLabel.position.set(-2, 2, 0);
  scene.add(circleLabel);

  // 加载字体并创建3D文字
  const fontLoader = new FontLoader();
  fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
    const textGeometry = new TextGeometry("Three.js Demo", {
      font: font,
      size: 0.5,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    // 创建文字材质
    const textMaterial = new THREE.MeshPhongMaterial({
      color: 0x2196f3, // 使用蓝色
      specular: 0x111111,
      shininess: 30,
    });

    // 创建文字网格
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // 居中文字
    textGeometry.computeBoundingBox();
    const textWidth =
      textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    textMesh.position.set(-textWidth / 2, 3, 0); // 放在场景上方

    // 添加到场景
    scene.add(textMesh);
  });

  // 添加 CSS 标题1
  const title1Container = document.createElement("div");
  title1Container.className = "title-container";

  const title1 = document.createElement("h1");
  title1.className = "title";
  title1.textContent = "主标题";
  title1.style.color = "#2196f3";
  title1.style.fontSize = "32px";
  title1.style.fontWeight = "bold";
  title1.style.textShadow = "2px 2px 4px rgba(0,0,0,0.2)";

  title1Container.appendChild(title1);

  const title1Label = new CSS2DObject(title1Container);
  title1Label.position.set(0, 4, 0); // 放在场景上方中央
  scene.add(title1Label);

  // 添加 CSS 标题2
  const title2Container = document.createElement("div");
  title2Container.className = "title-container";

  const title2 = document.createElement("h2");
  title2.className = "subtitle";
  title2.textContent = "副标题";
  title2.style.color = "#1976d2";
  title2.style.fontSize = "24px";
  title2.style.fontWeight = "500";
  title2.style.textShadow = "1px 1px 2px rgba(0,0,0,0.1)";

  title2Container.appendChild(title2);

  const title2Label = new CSS2DObject(title2Container);
  title2Label.position.set(0, 3.5, 0); // 放在主标题下方
  scene.add(title2Label);
  const d = addGeneralPoint({
    vector3: { x: 0, y: 0, z: 0 },
    data: { label: "测试点2" },
  });
  scene.add(d);
};
function addGeneralPoint(arg) {
  const { vector3, data } = arg;
  const vector = new THREE.Vector3(vector3.x, vector3.y, vector3.z);
  let box = document.createElement("div");
  const content = `
    <div style="z-index:99;display:flex;flex-direction:column; justify-content:left;align-items:center;margin-bottom:40px;">
    <div class="find_son" style="color:black;font-size:12px;font-weight:bold;text-shadow:-1px -1px 0 white, 1px -1px 0 white,-1px 1px 0 white,0.5px 0.5px 0 white;">${data.label}</div>
    <i style="font-size:20px;color:#75f9fd;" class="jzpoint iconfont icon-jizhundianbiaozhu"></i>
    </div>`;
  box.innerHTML = content;
  const tag = new CSS2DObject(box);
  tag.position.copy(vector);
  return tag;
}

const onMouseMove = (event) => {
  // 更新鼠标位置
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 更新射线
  raycaster.setFromCamera(mouse, camera);

  // 检测相交的物体
  const intersects = raycaster.intersectObjects(cubes);

  if (intersects.length > 0) {
    showTooltip.value = true;
    tooltipPosition.value = {
      x: event.clientX + 10,
      y: event.clientY + 10,
    };
  } else {
    showTooltip.value = false;
  }
};

const onDoubleClick = () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);

  if (intersects.length > 0) {
    // 重置所有立方体的颜色
    cubes.forEach((cube) => {
      cube.material.color.setHex(0x44aa88);
      cube.material.emissive.setHex(0x000000);
    });

    // 置选中立方体的颜色
    const selectedObject = intersects[0].object;
    selectedObject.material.color.setHex(0xff0000);
    selectedObject.material.emissive.setHex(0x331111);
    selectedCube.value = selectedObject;
    showTooltip.value = false;
  }
};

const onWindowResize = () => {
  const container = document.getElementById("three-container");
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.setSize(container.clientWidth, container.clientHeight);

  // 更新所有 LineMaterial 的分辨率
  scene.traverse((object) => {
    if (object.material && object.material.isLineMaterial) {
      object.material.resolution.set(
        container.clientWidth,
        container.clientHeight
      );
    }
  });
};

const animate = () => {
  requestAnimationFrame(animate);

  // 更新控制器
  controls.update();

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
};

const startSelection = () => {
  isSelecting.value = true;
  // 禁用 OrbitControls
  if (controls) {
    controls.enabled = false;
  }

  // 获取画布的尺寸
  const container = document.getElementById("three-container");
  const rect = container.getBoundingClientRect();

  // 确保初始位置不会超出画布
  selectionPosition.value = {
    x: Math.min(Math.max(0, (rect.width - 500) / 2), rect.width - 500),
    y: Math.min(Math.max(0, (rect.height - 300) / 2), rect.height - 300),
  };
  dragOffset.value = { x: 0, y: 0 };
};

const startDrag = (event) => {
  if (!isSelecting.value) return;

  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y,
  };

  // 添加全局事件监听
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
};

const handleDrag = (event) => {
  if (!isDragging.value || !isSelecting.value) return;

  const container = document.getElementById("three-container");
  const rect = container.getBoundingClientRect();

  // 计算新的位置
  const newX = event.clientX - dragStart.value.x;
  const newY = event.clientY - dragStart.value.y;

  // 限制选区在画布范围内
  const maxX = rect.width - 500;
  const maxY = rect.height - 300;

  dragOffset.value = {
    x: Math.min(
      Math.max(0 - selectionPosition.value.x, newX),
      maxX - selectionPosition.value.x
    ),
    y: Math.min(
      Math.max(0 - selectionPosition.value.y, newY),
      maxY - selectionPosition.value.y
    ),
  };
};

const stopDrag = () => {
  isDragging.value = false;

  // 确保最终位置也在画布范围内
  const container = document.getElementById("three-container");
  const rect = container.getBoundingClientRect();

  const newX = selectionPosition.value.x + dragOffset.value.x;
  const newY = selectionPosition.value.y + dragOffset.value.y;

  selectionPosition.value = {
    x: Math.min(Math.max(0, newX), rect.width - 500),
    y: Math.min(Math.max(0, newY), rect.height - 300),
  };

  dragOffset.value = { x: 0, y: 0 };

  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
};

const completeSelection = () => {
  console.log("Selection position:", selectionPosition.value);
  console.log("Drag offset:", dragOffset.value);
  console.log("Canvas dimensions:", {
    width: renderer.domElement.width,
    height: renderer.domElement.height,
  });

  // 强制渲染一帧
  renderer.render(scene, camera);

  // 获取当前渲染画布
  const canvas = renderer.domElement;

  // 创建一个临时画布来存储裁剪的图像
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 500;
  tempCanvas.height = 300;
  const ctx = tempCanvas.getContext("2d");

  // 计算实际的选区位置
  const x = selectionPosition.value.x + dragOffset.value.x;
  const y = selectionPosition.value.y + dragOffset.value.y;

  // 从渲染画布复制选中区域到临时画布
  ctx.drawImage(canvas, x, y, 500, 300, 0, 0, 500, 300);

  try {
    // 创建下载链接
    const link = document.createElement("a");
    link.download = "selection.png";
    // 将画布转换为 base64 图片数据
    link.href = tempCanvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("导出图片失败:", error);
  }

  // 重置选择状态
  isSelecting.value = false;

  // 重新启用 OrbitControls
  if (controls) {
    controls.enabled = true;
  }
};

// 添加四角按钮的函数
const addCornerButtons = () => {
  cornerButtons.value.forEach((btn) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "corner-button-container";

    const button = document.createElement("button");
    button.className = "corner-button";
    button.textContent = btn.label;
    button.style.pointerEvents = "auto";

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      console.log(`${btn.label} clicked - ${btn.action}`);
    });

    buttonContainer.appendChild(button);

    const buttonLabel = new CSS2DObject(buttonContainer);
    buttonLabel.position.set(btn.x, btn.y, btn.z);
    scene.add(buttonLabel);
  });
};

let _svgRenderer = null;

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

  // 克隆按钮
  cornerButtons.value.forEach((btn) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "corner-button-container";

    const button = document.createElement("button");
    button.className = "corner-button";
    button.textContent = btn.label;
    button.style.backgroundColor = "white";
    button.style.color = "#333";
    button.style.border = "1px solid #ccc";
    button.style.padding = "8px 16px";
    button.style.borderRadius = "4px";
    button.style.fontSize = "14px";
    button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
    button.style.whiteSpace = "nowrap";

    buttonContainer.appendChild(button);

    const buttonLabel = new CSS2DObject(buttonContainer);
    buttonLabel.position.set(btn.x, btn.y, btn.z);
    tempScene.add(buttonLabel);
  });

  // 创建 SVG 渲染器
  _svgRenderer = new SVGRenderer();
  _svgRenderer.setSize(window.innerWidth, window.innerHeight);
  _svgRenderer.render(tempScene, camera);

  // 获取 SVG 内容
  const svgElement = _svgRenderer.domElement;

  // 添加按钮样式到 SVG
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .corner-button-container {
      transform: translate(-50%, -50%);
    }
    .corner-button {
      background-color: white;
      color: #333;
      border: 1px solid #ccc;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      white-space: nowrap;
    }
  `;
  svgElement.insertBefore(styleElement, svgElement.firstChild);

  const svgContent = svgElement.outerHTML;
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "scene.svg";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  _svgRenderer = null;
};

// 添加新的截图函数
const captureCSS2D = () => {
  // 获取所有 CSS2D 元素的容器
  const css2dContainer = labelRenderer.domElement;

  // 创建一个新的容器来克隆元素
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = `${window.innerWidth}px`;
  container.style.height = `${window.innerHeight}px`;
  container.style.backgroundColor = "transparent"; // 改为透明背景
  container.style.zIndex = "9999";

  // 克隆 CSS2D 元素
  const clone = css2dContainer.cloneNode(true);
  container.appendChild(clone);

  // 临时添加到文档中
  document.body.appendChild(container);

  // 使用 html2canvas 捕获
  html2canvas(container, {
    backgroundColor: null, // 设置为 null 以保持透明
    scale: window.devicePixelRatio,
    logging: false,
    allowTaint: true,
    useCORS: true,
    onclone: (clonedDoc) => {
      // 确保克隆的元素可见
      const clonedContainer = clonedDoc.querySelector(".css2d-container");
      if (clonedContainer) {
        clonedContainer.style.display = "block";
        clonedContainer.style.visibility = "visible";
        clonedContainer.style.backgroundColor = "transparent"; // 确保克隆的容器也是透明的
      }
    },
  })
    .then((canvas) => {
      // 创建下载链接
      const link = document.createElement("a");
      link.download = "css2d-elements.png";
      link.href = canvas.toDataURL("image/png"); // 使用 PNG 格式以支持透明
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 处理临时容器
      document.body.removeChild(container);
    })
    .catch((error) => {
      console.error("截图失败:", error);
      alert("截图失败，请重试");
      document.body.removeChild(container);
    });
};

// 添加新的导出函数
const exportCSS2DSVG = () => {
  // 获取 CSS2D 容器
  const css2dContainer = labelRenderer.domElement;

  // 创建 SVG 元素
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", window.innerWidth);
  svg.setAttribute("height", window.innerHeight);
  svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);

  // 添加样式
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    .title-container {
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .find_son {
      color: black;
      font-size: 12px;
      font-weight: bold;
      text-shadow: -1px -1px 0 white, 
                   1px -1px 0 white,
                   -1px 1px 0 white,
                   0.5px 0.5px 0 white;
    }
  `;
  svg.appendChild(style);

  // 将 CSS2D 元素转换为 SVG 元素
  const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");

  // 克隆 CSS2D 容器
  const clone = css2dContainer.cloneNode(true);

  // 处理所有图标元素
  const iconElements = clone.querySelectorAll('.jzpoint');
  iconElements.forEach(icon => {
    // 创建 SVG 图标
    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("width", "20");
    iconSvg.setAttribute("height", "20");
    iconSvg.setAttribute("viewBox", "0 0 1024 1024");
    
    // 添加图标路径 - 使用实际的基准点标注图标路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M877.714 401.496c0-205.62-163.723-372.239-365.685-372.239-202.05 0-365.743 166.62-365.743 372.239 0 81.832 26.243 157.257 70.246 218.697h-0.41L512.03 1024 801.47 629.087h-0.526c47.952-62.961 76.77-141.78 76.77-227.591zM512.03 226.567c94.881 0 171.798 78.292 171.798 174.87 0 96.549-77.005 174.929-171.798 174.929-94.88 0-171.798-78.292-171.798-174.87 0-96.549 76.917-174.929 171.798-174.929z");
    path.setAttribute("fill", "#75f9fd");
    
    iconSvg.appendChild(path);
    icon.parentNode.replaceChild(iconSvg, icon);
  });

  foreignObject.appendChild(clone);
  svg.appendChild(foreignObject);

  // 导出 SVG
  const svgContent = new XMLSerializer().serializeToString(svg);
  
  // 添加 XML 声明和 DOCTYPE
  const finalSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgContent}`;

  const blob = new Blob([finalSvgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "css2d-elements.svg";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

onMounted(() => {
  init();
  animate();
});

onBeforeUnmount(() => {
  if (controls) {
    controls.dispose();
  }

  // 清除引用
  scene = null;
  camera = null;
  renderer = null;
  _svgRenderer = null;
  labelRenderer = null;
  raycaster = null;
  mouse = null;
});
</script>

<style scoped>
.scene-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #e6f3ff;
}

#three-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1000;
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  pointer-events: auto;
}

.control-panel button {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.control-panel button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.selection-mask {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.2);
  border: 2px solid #2196f3;
  cursor: move;
  z-index: 999;
  user-select: none;
}

.selection-border {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid white;
  pointer-events: none;
}

/* 修改场景容器样式 */
.scene-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #e6f3ff;
}

#three-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 修改控制面板样式，固定在 Three.js 画布左上角 */
.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  pointer-events: auto;
}

/* 新角落按钮样式 */
.corner-button-container {
  transform: translate(-50%, -50%);
  pointer-events: auto;
}

.corner-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

.corner-button:hover {
  background-color: #1976d2;
  transform: scale(1.1);
}

.corner-button:active {
  background-color: #0d47a1;
  transform: scale(0.95);
}

/* 更新的滚动条控制 */
::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

/* 添加全局样式，使用 :global 确保应用到整个应用 */
:global(html),
:global(body) {
  margin: 0;
  padding: 0;
  overflow: hidden !important;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* 确保元素都继承 border-box */
:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: inherit;
}

/* 移除之前的 flag 相关样式 */
.flag,
.flag-label {
  display: none;
}

/* 新圆形样式 */
.circle-container {
  transform: translate(-50%, -50%);
  pointer-events: auto !important;
  z-index: 1000;
}

.circle {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #2196f3, #21cbf3);
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  pointer-events: auto !important;
}

.circle:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.export-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
}

.export-btn:hover {
  background-color: #1976d2;
}

/* 添加标题样式 */
.title-container {
  transform: translate(-50%, -50%);
  pointer-events: none;
  text-align: center;
}

.title {
  margin: 0;
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.subtitle {
  margin: 0;
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.title-container:hover .title,
.title-container:hover .subtitle {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.capture-btn {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
}

.capture-btn:hover {
  background-color: #1976d2;
}

.export-css-btn {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
}

.export-css-btn:hover {
  background-color: #1976d2;
}
</style>
