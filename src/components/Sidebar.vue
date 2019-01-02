<template>
  <mu-paper :z-depth=3>
    <mu-container>
      <mu-expansion-panel :expand="panel === 'courses'" @change="togglePanel('courses')">
        <div slot="header">{{$t('menus.courses')}}</div>
        <mu-expansion-panel v-for="(c, i) in event.courses" :key="i" :expand="selectedCourse === i" @change="selectedCourse = i" :z-depth=1>
          <div slot="header">{{c.name}}</div>
          <control-description-sheet :event="event" :course="c" @controldescriptionset="$emit('controldescriptionset', $event)" />
        </mu-expansion-panel>
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
</template>

<script>
import ControlDescriptionSheet from './ControlDescriptionSheet.vue'

export default {
  components: { ControlDescriptionSheet },
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
