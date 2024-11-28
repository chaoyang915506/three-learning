<!--
 * @Author: lichaoyang chaoyang915506@163.com
 * @Date: 2024-11-23 13:38:43
 * @LastEditTime: 2024-11-28 21:00:17
 * @Description: 
 * 
-->
<template>
  <div id="app">
    <div class="nav-buttons">
      <button 
        v-for="(tab, index) in tabs" 
        :key="index"
        @click="currentScene = tab.value"
        :class="{ active: currentScene === tab.value }"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <ThreeScene v-if="currentScene === 'scene1'" />
    <ThreeScene2 v-if="currentScene === 'scene2'" />
    <SvgPreview v-if="currentScene === 'svgPreview'" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ThreeScene from './components/ThreeScene.vue';
import ThreeScene2 from './components/ThreeScene2.vue';
import SvgPreview from './components/SvgPreview.vue';

const currentScene = ref('scene1');

const tabs = [
  { label: '场景1', value: 'scene1' },
  { label: '场景2', value: 'scene2' },
  { label: 'SVG预览', value: 'svgPreview' }
];
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.nav-buttons {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

button {
  margin: 0;
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  background-color: #3aa876;
}

button.active {
  background-color: #2c3e50;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style> 