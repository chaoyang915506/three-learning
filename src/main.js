import { createApp } from "vue";
import "./style.css";
import "./assets/icon/iconfont.css";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// 添加错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info)
}

app.use(router);
app.mount('#app');
