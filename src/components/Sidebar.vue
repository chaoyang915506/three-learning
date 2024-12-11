<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="toggle-btn" :class="{ 'btn-collapsed': isCollapsed }" @click="toggleSidebar">
      <div class="toggle-icon">
        {{ isCollapsed ? '›' : '‹' }}
      </div>
    </div>
    <div class="menu-container" v-show="!isCollapsed">
      <div class="search-box">
        <input 
          ref="searchInput"
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索页面... (按 '/' 聚焦)"
          @input="debouncedSearch"
          @keydown.esc="clearSearch"
          @keydown.enter="handleEnter"
        >
        <button 
          v-if="searchQuery" 
          class="clear-btn" 
          @click="clearSearch"
        >
          ×
        </button>
      </div>
      <div class="search-history" v-if="showHistory && searchHistory.length">
        <div class="history-title">搜索历史</div>
        <div 
          v-for="(item, index) in searchHistory" 
          :key="index"
          class="history-item"
          @click="useHistoryItem(item)"
        >
          {{ item }}
          <span class="delete-history" @click.stop="removeHistory(index)">×</span>
        </div>
      </div>
      <div class="menu-items">
        <div
          v-for="route in filteredRoutes"
          :key="route.path"
          class="menu-item"
          :class="{ active: currentPath === route.path }"
          @click="navigateTo(route.path)"
        >
          <span class="menu-text" v-html="highlightText(route.meta.title)"></span>
        </div>
        <div v-if="filteredRoutes.length === 0" class="no-results">
          无匹配结果
        </div>
      </div>
      
      <div class="github-link">
        <a href="https://github.com/your-username/your-repo" target="_blank" rel="noopener noreferrer">
          <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span class="github-text">View on GitHub</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { debounce } from 'lodash-es'

const router = useRouter()
const route = useRoute()
const searchInput = ref(null)
const isCollapsed = ref(false)
const searchQuery = ref('')
const showHistory = ref(false)
const searchHistory = ref([])
const MAX_HISTORY = 5

// 从 localStorage 加载搜索历史
onMounted(() => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
  
  // 添加全局快捷键
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// 处理全局快捷键
const handleGlobalKeydown = (e) => {
  if (e.key === '/' && !isCollapsed.value) {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

const routes = router.options.routes.filter(route => route.path !== '/')
const currentPath = computed(() => route.path)

// 防抖处理
const debouncedSearch = debounce(() => {
  handleSearch()
}, 300)

const handleSearch = () => {
  showHistory.value = false
  if (searchQuery.value.trim()) {
    addToHistory(searchQuery.value)
  }
}

// 搜索历史相关函数
const addToHistory = (query) => {
  const trimmed = query.trim()
  if (!trimmed) return
  
  const index = searchHistory.value.indexOf(trimmed)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  searchHistory.value.unshift(trimmed)
  
  if (searchHistory.value.length > MAX_HISTORY) {
    searchHistory.value.pop()
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

const removeHistory = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

const useHistoryItem = (item) => {
  searchQuery.value = item
  showHistory.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
  showHistory.value = false
  searchInput.value?.focus()
}

const handleEnter = () => {
  if (filteredRoutes.value.length === 1) {
    navigateTo(filteredRoutes.value[0].path)
  }
}

// 高亮匹配文本
const highlightText = (text) => {
  if (!searchQuery.value.trim()) return text
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

const filteredRoutes = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return routes
  
  return routes.filter(route => {
    const title = route.meta.title.toLowerCase()
    const path = route.path.toLowerCase()
    return title.includes(query) || path.includes(query)
  })
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  emit('collapse', isCollapsed.value)
}

const navigateTo = (path) => {
  router.push(path)
}

const emit = defineEmits(['collapse'])
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  transition: width 0.3s ease;
  width: 200px;
  z-index: 1000;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 0;
}

.toggle-btn {
  position: fixed;
  left: 200px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 60px;
  background-color: rgba(44, 62, 80, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0 12px 12px 0;
  transition: left 0.3s ease;
  z-index: 1001;
  user-select: none;
}

.btn-collapsed {
  left: 0;
}

.toggle-icon {
  font-size: 20px;
  line-height: 1;
  padding: 4px;
  pointer-events: none;
}

.toggle-btn:hover {
  background-color: rgba(44, 62, 80, 1);
}

.menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-box {
  position: relative;
  padding: 16px;
  background-color: #243342;
}

.search-box input {
  width: 100%;
  padding: 10px 36px 10px 36px; /* 增加内边距以适应图标 */
  border: 2px solid transparent;
  border-radius: 8px;
  background-color: #34495e;
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

/* 添加搜索图标 */
.search-box::before {
  content: '🔍';
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.7;
  pointer-events: none;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.search-box input:focus {
  background-color: #3d566e;
  border-color: #3498db;
  box-shadow: 0 0 0 1px rgba(52, 152, 219, 0.3);
}

.search-box input:focus::placeholder {
  opacity: 0.7;
  transform: translateX(5px);
}

.clear-btn {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.search-history {
  background-color: #2c3e50;
  border-bottom: 1px solid #34495e;
  margin: 0 8px;
  border-radius: 8px;
  overflow: hidden;
}

.history-title {
  padding: 12px 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background-color: #243342;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.history-item {
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.history-item:hover {
  background-color: #34495e;
  border-left-color: #3498db;
  padding-left: 20px;
}

.delete-history {
  color: rgba(255, 255, 255, 0.5);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  opacity: 0;
  transition: all 0.3s ease;
}

.history-item:hover .delete-history {
  opacity: 1;
}

.delete-history:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e74c3c;
}

.highlight {
  background-color: rgba(52, 152, 219, 0.3);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
  color: #3498db;
  margin: 0 -2px;
}

.menu-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  padding-bottom: 70px;
}

.no-results {
  padding: 30px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.no-results::before {
  content: '🔍';
  font-size: 24px;
  opacity: 0.7;
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: #34495e;
  border-left-color: #3498db;
  padding-left: 24px;
}

.menu-item.active {
  background-color: #3498db;
  border-left-color: #2980b9;
}

/* 添加滚动条样式 */
.menu-items::-webkit-scrollbar {
  width: 4px;
}

.menu-items::-webkit-scrollbar-track {
  background: transparent;
}

.menu-items::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.menu-items::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.github-link {
  padding: 16px;
  background-color: #243342;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.github-link a {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.github-link a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.github-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.github-text {
  font-size: 14px;
  white-space: nowrap;
}
</style> 