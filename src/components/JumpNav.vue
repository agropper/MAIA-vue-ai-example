<template>
  <div class="jump-nav-wrapper">
    <select class="jump-nav" v-model="selectedUrl" @change="navigate">
      <option v-for="page in pages" :key="page.url" :value="page.url">
        {{ page.title }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import pageList from '../data/pageList'

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
        // Get the current query string (if any)
        const queryString = window.location.search

        // Navigate to the selected URL with the current query string appended
        window.location.href = `${this.selectedUrl}${queryString}`
      }
    }
  }
}
</script>
