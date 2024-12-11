<!--
 * @Author: lichaoyang chaoyang915506@163.com
 * @Date: 2024-11-23 13:38:43
 * @LastEditTime: 2024-11-30 16:21:49
 * @Description: 
 * 
-->
<template>
  <div class="app-container">
    <Sidebar @collapse="toggleSidebar" />
    <div class="main-content" :style="contentStyle">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import { ref, provide, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isCollapsed = ref(false)

const toggleSidebar = (collapsed) => {
  isCollapsed.value = collapsed
}

// 计算内容区域的样式
const contentStyle = computed(() => ({
  marginLeft: isCollapsed.value ? '0' : '200px',
  width: isCollapsed.value ? '100%' : 'calc(100% - 200px)',
  transition: 'all 0.3s ease'
}))

provide('isCollapsed', isCollapsed)

onMounted(() => {
  console.log('Current route:', router.currentRoute.value)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style> 