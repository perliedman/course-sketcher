<template>
    <div>
    <!-- <div ref="svg" style="position: absolute; width: 100%; height: 100%"/> -->
    <mu-expansion-panel :expand="panel === 'courses'" @change="togglePanel('courses')">
      <div slot="header">{{$t('menus.courses')}}</div>
      <mu-expansion-panel v-for="(c, i) in event.courses" :key="i" :expand="selectedCourse === i" @change="$emit('courseselected', {index: i })" :z-depth=1>
        <div slot="header">{{c.name}}</div>
        <div style="display: flex; justify-content: space-between;">
          <div>{{$t('course.printScale')}}</div>
          <div>1:<input type="number" v-model.number="c.printScale" style="width: 4em; text-align: right; border: none" step="500"/></div>
        </div>
        <control-description-sheet
          :event="event" 
          :course="c" 
          :selected-control-id="selectedControlId"
          @controldescriptionset="$emit('controldescriptionset', $event)" 
          @controlremoved="$emit('controlremoved', $event)"
          @controlkindset="$emit('controlkindset', $event)"/>
      </mu-expansion-panel>
    </mu-expansion-panel>      
    <mu-expansion-panel :expand="panel === 'map'" @change="togglePanel('map')">
      <div slot="header">{{$t('menus.map')}}</div>
      <h3>{{map.name}}</h3>
      1:{{map.file.getCrs().scale.toLocaleString($i18n.locale)}}
      <div slot="action">
        <mu-button slot="action" flat>{{$t('actions.removeMap')}}</mu-button>
      </div>
    </mu-expansion-panel>
    <mu-expansion-panel :expand="panel === 'print'" @change="togglePanel('print')">
      <div slot="header">{{$t('menus.print')}}</div>
        <mu-flex class="select-control-row">
          <mu-radio value="pdf" v-model="printMedia" label="PDF"></mu-radio>
        </mu-flex>
        <mu-flex class="select-control-row">
          <mu-radio value="svg" v-model="printMedia" label="SVG"></mu-radio>
        </mu-flex>
      <div slot="action">
        <mu-button slot="action" color="primary" @click="print">
          <mu-icon v-if="!totalPrintJobs" left value="print"/>
          <mu-circular-progress v-else :size="24" color="white" />
          {{!totalPrintJobs ? $t('actions.print') : ` ${$t('actions.printing')} ${currentPrintJob} / ${totalPrintJobs}`}}
        </mu-button>
      </div>
    </mu-expansion-panel>
    </div>
</template>

<script>
import Vue from 'vue'
import ControlDescriptionSheet from './ControlDescriptionSheet.vue'
import { ocadToSvg } from 'ocad2geojson'
import { saveAs } from 'file-saver'

import { courseMapToSvg, courseMapToPdf } from '../print'

export default {
  components: { ControlDescriptionSheet },
  props: {
    event: Object,
    map: Object,
    selectedCourse: Number,
    selectedControlId: Number
  },
  data () {
    return {
      panel: 'courses',
      printMedia: 'pdf',
      currentPrintJob: 0,
      totalPrintJobs: 0
    }
  },
  methods: {
    togglePanel (panel) {
      this.panel = panel === this.panel ? '' : panel
    },
    print () {
      const ocadFile = this.map.file
      const crs = ocadFile.getCrs()
      const mapSvg = ocadToSvg(ocadFile)
      const printFn = this.printMedia === 'pdf'
        ? course => () => 
          courseMapToPdf(ocadFile, mapSvg, course, crs)
          .then(blob => saveAs(blob, `${this.event.name}-${course.name}` + '.pdf'))
        :  course => () => 
          Promise.resolve(courseMapToSvg(mapSvg, course, crs))
          .then(svg => new Blob([svg.outerHTML], {type: 'image/svg+xml; charset=utf-8'}))
          .then(blob => saveAs(blob, `${this.event.name}-${course.name}` + '.svg'))
      const jobs = this.event.courses
        .filter(c => c.controls.length > 0)
        .map(printFn)

      this.currentPrintJob = 0
      this.totalPrintJobs = jobs.length
      const runNext = () => {
        this.currentPrintJob++
        if (jobs.length) {
          jobs.shift()().then(() => Vue.nextTick(runNext))
        } else {
          this.totalPrintJobs = 0
        }
      }

      Vue.nextTick(runNext)
    }
  }
}
</script>
