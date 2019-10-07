<template>
    <div>
    <!-- <div ref="svg" style="position: absolute; width: 100%; height: 100%"/> -->
    <mu-expansion-panel :expand="panel === 'courses'" @change="togglePanel('courses')">
      <div slot="header">{{$t('menus.courses')}}</div>
      <div style="position: relative; padding-bottom: 32px;">
        <mu-expansion-panel v-for="(c, i) in event.courses" :key="i" :expand="selectedCourse === i" @change="$emit('courseselected', { id: c.id })" :z-depth=1>
          <div slot="header">{{c.name}}</div>
            <control-description-sheet
              :event="event" 
              :course="c" 
              :selected-control-id="selectedControlId"
              @controldescriptionset="$emit('controldescriptionset', $event)" 
              @controlremoved="$emit('controlremoved', $event)"
              @controldeleted="$emit('controldeleted', $event)"
              @controlkindset="$emit('controlkindset', $event)"
              @eventnameset="$emit('eventnameset', $event)"
              @coursenameset="$emit('coursenameset', { name: $event.name, id: c.id })"
              @printscaleset="$emit('printscaleset', { scale: $event.scale, id: c.id })"
            />
        </mu-expansion-panel>
        <mu-menu cover :open.sync="menuOpen" style="position: absolute; right: 0; bottom: 0;">
          <mu-button fab small color="primary">
            <mu-icon value="more_horiz" />
          </mu-button>
          <mu-list slot="content">
            <mu-list-item button @click="addCourse">
              <mu-list-item-action>
                <mu-icon value="add"></mu-icon>
              </mu-list-item-action>
              <mu-list-item-title>{{$t('actions.newCourse')}}</mu-list-item-title>
            </mu-list-item>
            <mu-list-item button>
              <mu-list-item-action>
                <mu-icon value="cloud_upload"></mu-icon>
              </mu-list-item-action>
              <input type="file" accept=".ppen,.ocd" class="input-file" @change="uploadEvent"/>
              <mu-list-item-title>{{$t('actions.open')}}</mu-list-item-title>
            </mu-list-item>
            <mu-list-item button @click="downloadEvent">
              <mu-list-item-action>
                <mu-icon value="cloud_download"></mu-icon>
              </mu-list-item-action>
              <mu-list-item-title>{{$t('actions.save')}}</mu-list-item-title>
            </mu-list-item>
          </mu-list>
        </mu-menu>
      </div>
    </mu-expansion-panel>      
    <mu-expansion-panel :expand="panel === 'map'" @change="togglePanel('map')">
      <div slot="header">{{$t('menus.map')}}</div>
      <div v-if="map.file && map.file.header && map.file.header.fileType !== 1">
        <h3>{{map.name}}</h3>
        1:{{map.file.getCrs().scale.toLocaleString($i18n.locale)}}
        <div slot="action">
          <mu-button slot="action" flat @click="$emit('removemap')">{{$t('actions.removeMap')}}</mu-button>
        </div>
      </div>
      <div v-else>
        <h3>{{$t('map.mapMissing')}}</h3>
        <div slot="action">
          <mu-button slot="action" flat @click="$refs.fileInput.click()">{{$t('actions.selectMap')}}</mu-button>
          <input type="file" class="input-file" ref="fileInput" @change="$emit('filesdropped', { files: Array.from($event.target.files) })"/>
        </div>
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
import { writePpen } from '../ppen'

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
      totalPrintJobs: 0,
      menuOpen: false
    }
  },
  methods: {
    togglePanel (panel) {
      this.panel = panel === this.panel ? '' : panel
    },
    addCourse () {
      $emit('courseadded')
      this.menuOpen = false
    },
    uploadEvent (event) {
      this.menuOpen = false
      this.$emit('filesdropped', { files: Array.from(event.target.files) })
      event.target.value = null
    },
    downloadEvent () {
      const eventDoc = writePpen(this.event)
      const xmlString = '<?xml version="1.0" encoding="UTF-8"?>' + new XMLSerializer().serializeToString(eventDoc)
      const blob = new Blob([xmlString], {type: 'text/xml; charset=utf-8'})
      saveAs(blob, `${this.event.name}.ppen`)

      this.menuOpen = false
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

<style scoped>
  .input-file {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    cursor: pointer;
  }
</style>
