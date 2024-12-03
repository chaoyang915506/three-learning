<template>
  <div class="page-container">
    <div class="export-wrapper">
      <div id="contentToExport" class="content">
        <h1>HTML 导出 PDF 示例</h1>
        <div class="info-section">
          <h2>基本信息</h2>
          <p>姓名：张三</p>
          <p>年龄：25岁</p>
          <p>职业：软件工程师</p>
        </div>
        
        <div class="table-section">
          <h2>工作经历</h2>
          <table>
            <thead>
              <tr>
                <th>公司</th>
                <th>职位</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ABC科技有限公司</td>
                <td>前端开发工程师</td>
                <td>2020-2022</td>
              </tr>
              <tr>
                <td>XYZ网络科技</td>
                <td>高级前端工程师</td>
                <td>2022-至今</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="skills-section">
          <h2>技能特长</h2>
          <ul>
            <li>Vue.js</li>
            <li>React</li>
            <li>TypeScript</li>
            <li>Three.js</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="controls">
      <button @click="exportToPDF" class="export-btn">导出PDF</button>
    </div>
  </div>
</template>

<script setup>
import html2pdf from 'html2pdf.js';

const exportToPDF = () => {
  const element = document.getElementById('contentToExport');
  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'exported_document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1,
      useCORS: true,
      logging: true,
      ignoreElements: (element) => {
        return element.classList.contains('controls');
      },
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      putTotalPages: true
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after'
    }
  };

  // 开始导出
  html2pdf().set(opt).from(element).save();
};
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
  position: relative;
}

.export-wrapper {
  display: flex;
  justify-content: center;
  padding-bottom: 80px;
}

.content {
  width: 190mm;
  padding: 15mm;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  min-height: 277mm;
  box-sizing: border-box;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
  font-size: 24px;
}

h2 {
  color: #34495e;
  margin: 15px 0 8px;
  border-bottom: 2px solid #42b983;
  padding-bottom: 5px;
  font-size: 18px;
}

.info-section p {
  margin: 8px 0;
  line-height: 1.4;
  font-size: 14px;
}

.table-section table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 14px;
}

.table-section th,
.table-section td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.skills-section ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
}

.skills-section li {
  background-color: #42b983;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  list-style: none;
  display: inline-block;
}

@media print {
  .controls {
    display: none;
  }
  
  .content {
    box-shadow: none;
    padding: 0;
  }
  
  .skills-section ul {
    list-style: none !important;
  }
  
  .skills-section li {
    list-style: none !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  table {
    page-break-inside: avoid;
  }
  
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  h1, h2 {
    page-break-after: avoid;
  }
  
  .info-section, .table-section, .skills-section {
    page-break-inside: avoid;
  }
}

.controls {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.export-btn {
  padding: 12px 24px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.export-btn:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.export-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>
