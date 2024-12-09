<template>
  <div class="scene-container">
    <canvas ref="threeCanvas"></canvas>
    <button class="export-btn" @click="exportToSVG">导出SVG</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
// refs
const threeCanvas = ref(null);
const animationFrameId = ref(null);
const mapMarkers = ref([
  { position: [-2, 1, 0], label: '起点', icon: '📍' },
  { position: [2, -1, 0], label: '终点', icon: '🏁' }
]);

// three.js instances (非响应式)
let _scene = null;
let _camera = null;
let _renderer = null;
let _svgRenderer = null;
let _labelRenderer = null;
let _line = null;
let _endPoint1 = null;
let _endPoint2 = null;
let controls = null;
// methods
const createLine = () => {
  // 创建红色线段
  const redLineGeometry = new LineGeometry();
  redLineGeometry.setPositions([
    -2, 1, 0,
    2, -1, 0
  ]);

  const redLineMaterial = new LineMaterial({
    color: 0xff0000,
    linewidth: 5, // 粗线条
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    dashed: false,
    vertexColors: false,
    alphaToCoverage: false,
  });

  redLineMaterial.resolution.set(window.innerWidth, window.innerHeight);
  _line = new Line2(redLineGeometry, redLineMaterial);
  _line.computeLineDistances();
  _scene.add(_line);

  // 创建端点小球
  const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000
  });

  _endPoint1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
  _endPoint2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
  
  _endPoint1.position.set(-2, 1, 0);
  _endPoint2.position.set(2, -1, 0);
  
  _scene.add(_endPoint1);
  _scene.add(_endPoint2);

  // 创建紫色线段
  const purpleLineGeometry = new LineGeometry();
  purpleLineGeometry.setPositions([
    -2, 1, 0.1,
    2, -1, 0.1
  ]);

  const purpleLineMaterial = new LineMaterial({
    color: 0xff00ff,
    linewidth: 8, // 更粗的线条
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    dashed: false,
    vertexColors: false,
    alphaToCoverage: false,
  });

  purpleLineMaterial.resolution.set(window.innerWidth, window.innerHeight);
  const purpleLine = new Line2(purpleLineGeometry, purpleLineMaterial);
  purpleLine.computeLineDistances();
  _scene.add(purpleLine);
};

const createMapMarkers = () => {
  mapMarkers.value.forEach(marker => {
    const markerDiv = document.createElement('div');
    markerDiv.className = 'map-marker';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'marker-icon';
    iconSpan.textContent = marker.icon;
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'marker-label';
    labelSpan.textContent = marker.label;
    
    markerDiv.appendChild(iconSpan);
    markerDiv.appendChild(labelSpan);
    
    const markerLabel = new CSS2DObject(markerDiv);
    markerLabel.position.set(...marker.position);
    _scene.add(markerLabel);
  });
};


const animate = () => {
  if (!_renderer || !_scene || !_camera || !_labelRenderer) {
    return;
  }
  controls.update();
  animationFrameId.value = requestAnimationFrame(animate);
  _renderer.render(_scene, _camera);
  _labelRenderer.render(_scene, _camera);
};

const handleResize = () => {
  if (!_camera || !_renderer || !_labelRenderer) return;
  
  const width = window.innerWidth;
  const height = window.innerHeight;

  _camera.aspect = width / height;
  _camera.updateProjectionMatrix();
  _renderer.setSize(width, height);
  _labelRenderer.setSize(width, height);
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 更新所有线段材质的分辨率
  _scene.traverse((object) => {
    if (object.material && object.material.isLineMaterial) {
      object.material.resolution.set(width, height);
    }
  });
};

const exportToSVG = () => {
  _svgRenderer = new SVGRenderer();
  _svgRenderer.setSize(window.innerWidth, window.innerHeight);
  _svgRenderer.render(_scene, _camera);
  
  const svgContent = _svgRenderer.domElement.outerHTML;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'scene.svg';
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  _svgRenderer = null;
};

// lifecycle hooks
onMounted(() => {
  // 创建场景
  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(0xe6f3ff); // 修改为浅蓝色

  // 创建相机
  _camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  _camera.position.z = 5;

  // 创建渲染器
  _renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    alpha: true,
    antialias: true
  });
  _renderer.setSize(window.innerWidth, window.innerHeight);
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  initControls()
  // 添加线段和点
  createLine();

  // 添加 CSS2D 渲染器
  _labelRenderer = new CSS2DRenderer();
  _labelRenderer.setSize(window.innerWidth, window.innerHeight);
  _labelRenderer.domElement.style.position = 'absolute';
  _labelRenderer.domElement.style.top = '0';
  _labelRenderer.domElement.style.pointerEvents = 'none';
  document.querySelector('.scene-container').appendChild(_labelRenderer.domElement);

  // 创建地图标记
  createMapMarkers();

  window.addEventListener('resize', handleResize);
  animate();
});
const initControls = () => {
  controls = new OrbitControls(_camera, _renderer.domElement);
  controls.enableDamping = true;
};

onBeforeUnmount(() => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
  }
  
  if (_scene) {
    _scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
  
  if (_renderer) {
    _renderer.dispose();
    _renderer.forceContextLoss();
    _renderer.domElement = null;
  }

  if (_labelRenderer) {
    _labelRenderer.domElement?.remove();
    _labelRenderer = null;
  }

  window.removeEventListener('resize', handleResize);
  
  // 清除用
  _scene = null;
  _camera = null;
  _renderer = null;
  _svgRenderer = null;
  _line = null;
  _endPoint1 = null;
  _endPoint2 = null;
});
</script>

<style scoped>
.scene-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #e6f3ff;
}

canvas {
  display: block;
  background-color: #e6f3ff;
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

.map-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -100%);
  cursor: pointer;
  pointer-events: auto;
}

.marker-icon {
  font-size: 24px;
  line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
  transition: transform 0.2s ease;
}

.marker-label {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  white-space: nowrap;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease;
}

.map-marker:hover .marker-icon {
  transform: scale(1.2);
}

.map-marker:hover .marker-label {
  opacity: 1;
  transform: translateY(0);
}
</style> 