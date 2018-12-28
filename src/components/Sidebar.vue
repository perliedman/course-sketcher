<template>
  <div class="sidebar">
    <mu-paper :z-depth=3>
      <mu-container>
        <mu-expansion-panel :expand="panel === 'courses'" @change="togglePanel('courses')">
          <div slot="header">{{$t('menus.courses')}}</div>
          <mu-list :value="selectedCourse">
            <mu-list-item button @click="selectedCourse = i" v-for="(c, i) in event.courses" :key="i" :value="i">
              <mu-list-item-title>{{c.name}}</mu-list-item-title>
            </mu-list-item>
          </mu-list>
        </mu-expansion-panel>      
        <mu-expansion-panel :expand="panel === 'map'" @change="togglePanel('map')">
          <div slot="header">{{$t('menus.map')}}</div>
          <h3>{{map.name}}</h3>
          <div slot="action">
            <mu-button slot="action" flat>{{$t('actions.removeMap')}}</mu-button>
          </div>
        </mu-expansion-panel>
        <mu-expansion-panel :expand="panel === 'print'" @change="togglePanel('print')">
          <div slot="header">{{$t('menus.print')}}</div>
        </mu-expansion-panel>
      </mu-container>
    </mu-paper>
  </div>
</template>

<script>
export default {
  props: {
    event: Object,
    map: Object
  },
  data () {
    return {
      selectedCourse: 0,
      panel: 'courses'
    }
  },
  methods: {
    togglePanel(panel) {
      this.panel = panel === this.panel ? '' : panel
    }
  }
}
</script>

<style>
  .sidebar {
    position: absolute;
    z-index: 1;
    right: 1rem;
    top: 1rem;
    padding: 1rem;
    width: 30em;
  }
</style>
