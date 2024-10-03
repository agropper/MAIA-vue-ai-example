// types.d.ts or shims-vue.d.ts

// Declare the types for each component
declare module './components/ChatArea.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module './components/BottomToolbar.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
