<template>
  <div class="jump-nav-wrapper">
    <select class="jump-nav" v-model="selectedUrl" @change="navigate">
      <option v-for="page in pages" :key="page.url" :value="page.url">
        {{ page.title }}
      </option>
    </select>
  </div>
</template>

<script>
import pageList from '/src/data/pageList'

export default {
  name: 'JumpNav',
  data() {
    return {
      pages: pageList,
      selectedUrl: ''
    }
  },
  created() {
    // Initialize selectedUrl to the current page's URL
    this.selectedUrl = window.location.pathname
  },
  methods: {
    navigate() {
      if (this.selectedUrl && this.selectedUrl !== window.location.pathname) {
        window.location.href = this.selectedUrl
      }
    }
  }
}
</script>
