<template>
  <div class="scene-container">
    <canvas ref="threeCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// 常量配置
const SPHERE_CONFIG = {
  radius: 0.7,
  segments: 16,
  color: 0x00ff00,
  inactiveColor: 0xdbdee1,
  positions: [
    [0, 0, 0],
    [2, 0, 0],
    [5, 0, 0]
  ]
};

// refs
const threeCanvas = ref(null);
const animationFrameId = ref(null);

// three.js instances
let scene, camera, renderer, controls;
const clock = new THREE.Clock();
const spheres = [];
const raycaster = new THREE.Raycaster();

// 初始化场景
const initScene = () => {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);
};

// 初始化渲染器
const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

const mouse = new THREE.Vector2();
const raycaster1 = new THREE.Raycaster();
window.addEventListener("mousedown", (ev) => {
//   console.log("click");
  mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  raycaster1.setFromCamera(mouse, camera);
  const intersects = raycaster1.intersectObjects(spheres);
  for(const sphere of spheres) {
    sphere.material.color.set(SPHERE_CONFIG.inactiveColor);
  }
  for(const intersect of intersects) {
    intersect.object.material.color.set(SPHERE_CONFIG.color);
  }

});
// 创建球体
const createSphere = (position) => {
  const geometry = new THREE.SphereGeometry(
    SPHERE_CONFIG.radius, 
    SPHERE_CONFIG.segments, 
    SPHERE_CONFIG.segments
  );
  const material = new THREE.MeshBasicMaterial({ 
    color: SPHERE_CONFIG.color 
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(...position);
  return sphere;
};

// 初始化场景对象
const initSceneObjects = () => {
  // 创建多个球体
  SPHERE_CONFIG.positions.forEach(position => {
    const sphere = createSphere(position);
    spheres.push(sphere);
    scene.add(sphere);
  });

  // 添加坐标轴辅助
  const axisHelper = new THREE.AxesHelper(150);
  scene.add(axisHelper);
};

// 初始化控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
};


// 更新球体位置和颜色
const updateSpheres = (time) => {
  // 设置射线起点和方向
  const rayOrigin = new THREE.Vector3(-5, 0, 0);
  const rayDirection = new THREE.Vector3(5, 0, 0);
  rayDirection.normalize();
  raycaster.set(rayOrigin, rayDirection);

  // 检测相交的球体
  const intersects = raycaster.intersectObjects(spheres);

  // 更新球体位置和颜色
  spheres.forEach((sphere, index) => {
    // 更新Y轴位置
    sphere.position.y = Math.sin(time * (1 + index * 0.1)) * 4;
    // 设置默认颜色
    sphere.material.color.set(SPHERE_CONFIG.inactiveColor);
  });

  // 设置相交球体的颜色
  intersects.forEach(intersect => {
    intersect.object.material.color.set(SPHERE_CONFIG.color);
  });
};

// 动画循环
const animate = () => {
  if (!renderer || !scene || !camera) return;

  const time = clock.getElapsedTime();
  
//   updateSpheres(time);
  controls.update();
  renderer.render(scene, camera);
  
  animationFrameId.value = requestAnimationFrame(animate);
};

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

// 清理资源
const cleanup = () => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
  }

  window.removeEventListener("resize", handleResize);

  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement = null;
  }

  if (controls) {
    controls.dispose();
  }

  // 清空引用
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
};

// 初始化
const init = () => {
  initScene();
  initRenderer();
  initControls();
  initSceneObjects();
};

onMounted(() => {
  init();
  animate();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(cleanup);
</script>

<style scoped>
.scene-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

canvas {
  display: block;
}
</style>
