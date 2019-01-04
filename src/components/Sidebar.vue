<template>
    <div>
    <!-- <div ref="svg" style="position: absolute; width: 100%; height: 100%"/> -->
    <mu-container>
      <mu-expansion-panel :expand="panel === 'courses'" @change="togglePanel('courses')">
        <div slot="header">{{$t('menus.courses')}}</div>
        <mu-expansion-panel v-for="(c, i) in event.courses" :key="i" :expand="selectedCourse === i" @change="$emit('courseselected', {index: i })" :z-depth=1>
          <div slot="header">{{c.name}}</div>
          <control-description-sheet
            :event="event" 
            :course="c" 
            :selected-control-id="selectedControlId"
            @controldescriptionset="$emit('controldescriptionset', $event)" 
            @controlremoved="$emit('controlremoved', $event)"/>
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
        <div slot="action">
          <mu-button slot="action" color="primary" @click="print">
            <mu-icon v-if="!totalPrintJobs" left value="print"/>
            <mu-circular-progress v-else :size="24" color="white" />
            {{!totalPrintJobs ? $t('actions.print') : ` ${$t('actions.printing')} ${currentPrintJob} / ${totalPrintJobs}`}}
          </mu-button>
        </div>
      </mu-expansion-panel>
    </mu-container>
    </div>
</template>

<script>
import Vue from 'vue'
import ControlDescriptionSheet from './ControlDescriptionSheet.vue'
import { ocadToSvg } from 'ocad2geojson'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'
import blobStream from 'blob-stream'
import { saveAs } from 'file-saver'

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
      const jobs = this.event.courses.filter(c => c.controls.length > 0).map(course => () => new Promise((resolve) => {
        const mmToPt = 2.83465
        const scaleFactor = crs.scale / 10000 // 10000 should be the course's print scale setting

        const svg = ocadToSvg(ocadFile)
        const mapGroup = svg.querySelector('g')
        const courseSvg = course.toSvg()
        mapGroup.appendChild(courseSvg)
        const bounds = course.bounds()
        // Padding (could be a setting)
        ;[-20, -20, 20, 20].forEach((x, i) => bounds[i] += x / scaleFactor)
        // TODO: A4 page in millimeters, this should be configurable
        const mapWidthPt = Math.min(595, Math.ceil((bounds[2] - bounds[0]) * mmToPt * scaleFactor))
        const mapHeightPt = Math.min(842, Math.ceil((bounds[3] - bounds[1]) * mmToPt * scaleFactor))
        svg.setAttribute('width', mapWidthPt)
        svg.setAttribute('height', mapHeightPt)
        // svg.setAttribute('viewBox', `0 0 ${bounds[2] - bounds[0]} ${bounds[3] - bounds[1]}`)
        const transform = `scale(${mmToPt / 100 * scaleFactor}) translate(${-bounds[0] * 100}, ${bounds[3] * 100})`
        mapGroup.setAttribute('transform', transform)

        const doc = new PDFDocument()
        const stream = doc.pipe(blobStream())

        doc.fillColor('black')
          .fillOpacity(1)
          .strokeColor('black')
          .strokeOpacity(1)
          .lineWidth(1)
          .undash()
          .fontSize(12)
          .font('Helvetica')

        SVGtoPDF(doc, svg, 595 / 2 - mapWidthPt / 2, 842 / 2 - mapHeightPt / 2, {
          assumePt: true,
          colorCallback: x => {
            const color = x && ocadFile.colors.find(c => c && c.rgbArray[0] === x[0][0] && c.rgbArray[1] === x[0][1] && c.rgbArray[2] === x[0][2])
            return color && color.cmyk && [color.cmyk, x[1]] || x
          }
        })

        doc.end()
        stream.on('finish', () => {
          const blob = stream.toBlob('application/pdf')
          saveAs(blob, `${this.event.name}-${course.name}` + '.pdf')
          resolve()
        })
      }))

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
