<template>
  <div class="svg-preview-container">
    <div 
      class="upload-area"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      :class="{ 'dragging': isDragging }"
    >
      <input
        type="file"
        ref="fileInput"
        @change="handleFileUpload"
        accept=".svg"
        style="display: none"
      />
      <div class="upload-content">
        <button class="upload-btn" @click="triggerFileInput">选择SVG文件</button>
        <p class="upload-text">或将文件拖拽到此处</p>
        <span v-if="fileName" class="file-name">当前文件: {{ fileName }}</span>
      </div>
    </div>
    
    <div class="preview-area" v-if="svgContent">
      <div v-html="svgContent" class="svg-content"></div>
    </div>
    
    <div class="placeholder" v-else>
      <icon-upload class="upload-icon" />
      <p>请上传SVG文件进行预览</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const fileInput = ref(null);
const svgContent = ref('');
const fileName = ref('');
const isDragging = ref(false);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleSVGFile = (file) => {
  if (!file || !file.name.toLowerCase().endsWith('.svg')) {
    alert('请上传SVG格式的文件');
    return;
  }
  
  fileName.value = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    // 基本的SVG安全检查
    if (content.includes('<svg') && content.includes('</svg>')) {
      svgContent.value = content;
    } else {
      alert('无效的SVG文件');
      svgContent.value = '';
      fileName.value = '';
    }
  };
  
  reader.readAsText(file);
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  handleSVGFile(file);
};

const handleDragOver = (event) => {
  isDragging.value = true;
  event.dataTransfer.dropEffect = 'copy';
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  handleSVGFile(file);
};
</script>

<style scoped>
.svg-preview-container {
  width: 100%;
  height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f5f5;
}

.upload-area {
  width: 100%;
  max-width: 800px;
  min-height: 200px;
  margin-bottom: 20px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  background-color: white;
}

.upload-area.dragging {
  border-color: #42b983;
  background-color: rgba(66, 185, 131, 0.1);
}

.upload-content {
  text-align: center;
}

.upload-btn {
  padding: 12px 24px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 12px;
}

.upload-btn:hover {
  background-color: #3aa876;
}

.upload-text {
  color: #666;
  margin: 10px 0;
}

.file-name {
  display: block;
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.preview-area {
  width: 100%;
  max-width: 800px;
  height: calc(100vh - 300px);
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.svg-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.svg-content svg {
  max-width: 100%;
  max-height: 100%;
}

.placeholder {
  width: 100%;
  height: calc(100vh - 300px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 18px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-icon {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 16px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.dragging .upload-icon {
  animation: bounce 1s infinite;
}
</style> 