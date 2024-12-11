import { createRouter, createWebHistory } from 'vue-router'
import ThreeScene from '../components/ThreeScene.vue'
import ThreeScene2 from '../components/ThreeScene2.vue'
import ThreeScene3 from '../components/ThreeScene3.vue'
import ThreeScene4 from '../components/ThreeScene4.vue'

const routes = [
  {
    path: '/',
    redirect: '/scene1'
  },
  {
    path: '/scene1',
    name: 'Scene1',
    component: ThreeScene,
    meta: { title: '场景1 - 导出cssRenderer' }
  },
  {
    path: '/scene2',
    name: 'Scene2',
    component: ThreeScene2,
    meta: { title: '场景2 - 实体导出' }
  },
  {
    path: '/scene3',
    name: 'Scene3',
    component: ThreeScene3,
    meta: { title: '场景3 - 球体场景' }
  },
  {
    path: '/scene4',
    name: 'Scene4',
    component: ThreeScene4,
    meta: { title: '场景4 - HTML导出' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加导航守卫和调试信息
router.beforeEach((to, from, next) => {
  console.log('Route change:', { from: from.path, to: to.path })
  document.title = to.meta.title || 'Three.js Demo'
  next()
})

router.onError((error) => {
  console.error('Router error:', error)
})

export default router 