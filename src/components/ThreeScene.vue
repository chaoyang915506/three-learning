<template>
  <div class="scene-container">
    <div id="three-container"></div>
    <div v-if="showTooltip" 
         class="tooltip" 
         :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }">
      双击选中方块
    </div>

    <!-- 添加控制按钮 -->
    <div class="control-panel">
      <button @click="startSelection" :disabled="isSelecting">开始选取</button>
      <button @click="completeSelection" :disabled="!isSelecting">完成选取</button>
    </div>

    <!-- 选区蒙版 -->
    <div v-if="isSelecting"
         class="selection-mask"
         :style="{
           left: selectionPosition.x + 'px',
           top: selectionPosition.y + 'px',
           width: '500px',
           height: '300px',
           transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`
         }"
         @mousedown="startDrag"
         >
      <div class="selection-border"></div>
    </div>

    <!-- 添加红旗的HTML模板 -->
    <div id="flag-template" style="display: none;">
      <div class="flag">
        🚩
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

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

const cornerButtons = ref([
  { x: -4, y: 2, z: -2, label: '左上角', action: '操作1' },
  { x: 4, y: 2, z: -2, label: '右上角', action: '操作2' },
  { x: -4, y: -2, z: -2, label: '左下角', action: '操作3' },
  { x: 4, y: -2, z: -2, label: '右下角', action: '操作4' }
]);

const init = () => {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

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
  document.getElementById('three-container').appendChild(renderer.domElement);

  // 添加CSS2D渲染器
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('three-container').appendChild(labelRenderer.domElement);

  // 创建射线检测器
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 创建三个立方体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });

  // 创建三个立方体并设置位置
  for (let i = 0; i < 3; i++) {
    const cube = new THREE.Mesh(geometry, material.clone());
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

  // 添加事件监听器
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('dblclick', onDoubleClick);
  window.addEventListener('resize', onWindowResize);

  // 添加四角按钮
  addCornerButtons();
};

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
      y: event.clientY + 10
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
    cubes.forEach(cube => {
      cube.material.color.setHex(0x44aa88);
      cube.material.emissive.setHex(0x000000);
    });

    // 设置选中立方体的颜色
    const selectedObject = intersects[0].object;
    selectedObject.material.color.setHex(0xff0000);
    selectedObject.material.emissive.setHex(0x331111);
    selectedCube.value = selectedObject;
    showTooltip.value = false;
  }
};

const onWindowResize = () => {
  const container = document.getElementById('three-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
};

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
};

const startSelection = () => {
  isSelecting.value = true;
  // 获取画布容器的尺寸
  const container = document.getElementById('three-container');
  const rect = container.getBoundingClientRect();
  
  // 确保初始位置不会超出画布
  selectionPosition.value = {
    x: Math.min(Math.max(0, (rect.width - 500) / 2), rect.width - 500),
    y: Math.min(Math.max(0, (rect.height - 300) / 2), rect.height - 300)
  };
  dragOffset.value = { x: 0, y: 0 };
};

const startDrag = (event) => {
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  };

  // 添加全局事件监听
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

const handleDrag = (event) => {
  if (!isDragging.value) return;
  
  const container = document.getElementById('three-container');
  const rect = container.getBoundingClientRect();
  
  // 计算新的位置
  const newX = event.clientX - dragStart.value.x;
  const newY = event.clientY - dragStart.value.y;
  
  // 限制选区在画布范围内
  const maxX = rect.width - 500;
  const maxY = rect.height - 300;
  
  dragOffset.value = {
    x: Math.min(Math.max(0 - selectionPosition.value.x, newX), maxX - selectionPosition.value.x),
    y: Math.min(Math.max(0 - selectionPosition.value.y, newY), maxY - selectionPosition.value.y)
  };
};

const stopDrag = () => {
  isDragging.value = false;
  
  // 确保最终位置也在画布范围内
  const container = document.getElementById('three-container');
  const rect = container.getBoundingClientRect();
  
  const newX = selectionPosition.value.x + dragOffset.value.x;
  const newY = selectionPosition.value.y + dragOffset.value.y;
  
  selectionPosition.value = {
    x: Math.min(Math.max(0, newX), rect.width - 500),
    y: Math.min(Math.max(0, newY), rect.height - 300)
  };
  
  dragOffset.value = { x: 0, y: 0 };
  
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const completeSelection = () => {
  // 创一个新的渲染目标
  const renderTarget = new THREE.WebGLRenderTarget(
    renderer.domElement.width,
    renderer.domElement.height
  );

  // 渲染场景到目标
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  // 创建一个临时画布
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 300;
  const context = canvas.getContext('2d');

  // 读取像素
  const pixelBuffer = new Uint8Array(4 * renderer.domElement.width * renderer.domElement.height);
  renderer.readRenderTargetPixels(
    renderTarget,
    selectionPosition.value.x,
    renderer.domElement.height - selectionPosition.value.y - 300, // 翻转Y坐标
    500,
    300,
    pixelBuffer
  );

  // 创建ImageData
  const imageData = context.createImageData(500, 300);
  for (let i = 0; i < pixelBuffer.length; i++) {
    imageData.data[i] = pixelBuffer[i];
  }
  context.putImageData(imageData, 0, 0);

  // 导出图片
  const link = document.createElement('a');
  link.download = 'selection.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  // 清理
  renderTarget.dispose();
  isSelecting.value = false;
};

// 添加四角按钮的函数
const addCornerButtons = () => {
  cornerButtons.value.forEach(btn => {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'corner-button-container';
    
    const button = document.createElement('button');
    button.className = 'corner-button';
    button.textContent = btn.label;
    button.style.pointerEvents = 'auto';
    
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      console.log(`${btn.label} clicked - ${btn.action}`);
    });
    
    buttonContainer.appendChild(button);

    const buttonLabel = new CSS2DObject(buttonContainer);
    buttonLabel.position.set(btn.x, btn.y, btn.z);
    scene.add(buttonLabel);
  });
};

onMounted(() => {
  init();
  animate();
});
</script>

<style scoped>
.scene-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#three-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
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
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#three-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 修改控制面板样式，固定在 Three.js 画布左上角 */
.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  pointer-events: auto;
}

/* 更新角落按钮样式 */
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
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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

/* 更全面的滚动条控制 */
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

/* 确保所有元素都继承 border-box */
:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: inherit;
}

/* 移除之前的 flag 相关样式 */
.flag, .flag-label {
  display: none;
}
</style> 