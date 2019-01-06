<template>
  <div id="app">
    <mu-appbar style="width: 100%" color="primary">
      <mu-button icon slot="left" :disabled="!map.file" @click="menuOpen = !menuOpen">
        <mu-icon value="menu"></mu-icon>
      </mu-button>
      <span class="title">
        Course Sketcher
      </span>
      <mu-button icon slot="right">
        <mu-icon value="settings"></mu-icon>
      </mu-button>
    </mu-appbar>
    <mu-drawer v-if="map.file" :open.sync="menuOpen" :width=400>
      <sidebar
        :event="event"
        :map="map"
        :selected-course="selectedCourse"
        :selected-control-id="selectedControl"
        @courseselected="selectedCourse = $event.index"
        @controldescriptionset="controlDescriptionSet"
        @controlremoved="controlRemoved" />
    </mu-drawer>
    <map-view
      :controls="controlsGeoJson"
      :control-texts="controlLabelsGeoJson"
      :control-connections="controlCollectionsGeoJson"
      :layers="layers"
      :map-geojson="mapGeojson"
      :map-rotation="mapRotation"
      @controladded="controlAdded"
      @controlmoved="controlMoved"
      @controlselected="controlSelected"
      @fileselected="mapFileSelected"/>
    <mu-snackbar position="bottom" :open="!!message">
      <span v-html="message" />
      <mu-button flat slot="action" color="primary" @click="message = undefined">Close</mu-button>
    </mu-snackbar>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import MapView from './components/MapView.vue'
import parsePPen from './parse-ppen.js'
import { readOcad, ocadToGeoJson, ocadToMapboxGlStyle } from 'ocad2geojson'
import { toWgs84 } from 'reproject'
import proj4 from 'proj4'
import bbox from '@turf/bbox'

import Course from './models/course.js'
import { featureCollection } from '@turf/helpers'
import { coordEach } from '@turf/meta'

// Since the actual geographic coordinates do not have any significance (yet?), just about any CRS will do
const projDef = '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs'

export default {
  name: 'app',
  data () {
    return {
      map: {},
      event: {
        name: this.$t('event.newName'),
        courses: [
          new Course(1, this.$t('course.newName'), [], 15000)
        ]
      },
      selectedCourse: 0,
      selectedControl: 0,
      layers: [],
      mapGeojson: {},
      mapRotation: 0,
      menuOpen: true,
      message: undefined
    }
  },
  computed: {
    controlsGeoJson () {
      const f = this.event.courses[this.selectedCourse].controlsToGeoJson() || featureCollection([])
      return this.event && this.event.courses && this.map.file && applyCrs(this.map.file.getCrs(), f)
    },
    controlLabelsGeoJson () {
      return this.event && this.event.courses && this.map.file && applyCrs(this.map.file.getCrs(), this.event.courses[this.selectedCourse].controlLabelsToGeoJson() || featureCollection([]))
    },
    controlCollectionsGeoJson () {
      return this.event && this.event.courses && this.map.file && applyCrs(this.map.file.getCrs(), this.event.courses[this.selectedCourse].controlConnectionsToGeoJson() || featureCollection([]))
    }
  },
  methods: {
    mapFileSelected(f) {
      this.message = undefined
      if (f.name.toLowerCase().endsWith('.ocd')) {
        readOcad(f.content)
          .then(ocadFile => {
            this.mapGeojson = Object.freeze(toWgs84(ocadToGeoJson(ocadFile), projDef))
            const [minLng, minLat, maxLng, maxLat] = bbox(this.mapGeojson)
            const [minX, minY] = proj4(proj4.WGS84, projDef, [minLng, minLat])
            const [maxX, maxY] = proj4(proj4.WGS84, projDef, [minLng, maxLat])
            this.mapRotation = Math.atan2(maxY - minY, maxX - minX) / Math.PI * 180 - 90
            this.layers = ocadToMapboxGlStyle(ocadFile, {source: 'map', sourceLayer: ''})
            this.map = {
              name: f.name,
              file: Object.freeze(ocadFile) 
            }
          })
          .then(() => {
            if (this.event && this.event.map && this.map.name != this.event.map.name) {
              this.message = this.$t('messages.ensureCorrectMap', { fileName: this.event.map.name })
            }
          })
          .catch(err => {
            console.error(err)
            this.message = this.$t('messages.mapLoadError', {error: err.message}) 
            this.loading = false
          })
      } else if (f.name.toLowerCase().endsWith('.ppen')) {
        const doc = new DOMParser().parseFromString(f.content, 'application/xml')
        try {
          this.event = parsePPen(doc)
          if (!this.map.name) {
            this.message = this.$t('messages.mapFileRequest', { fileName: this.event.map.name })
          } else if (this.map.name != this.event.map.name) {
            this.message = this.$t('message.ensureCorrectMap', { fileName: this.event.map.name })
          }
        } catch (err) {
          this.message = this.$t('messages.mapLoadError', {error: err.message}) 
        }
      } else {
        this.message = this.$t('messages.unknownFileType') 
      }
    },
    controlAdded (e) {
      const crs = this.map.file.getCrs()
      const projectedCoord = proj4(proj4.WGS84, projDef, e.coordinates)
      const coordinates = [
        (projectedCoord[0] - crs.easting) / crs.scale / mmToMeter,
        (projectedCoord[1] - crs.northing) / crs.scale / mmToMeter,
      ]
      this.event.courses[this.selectedCourse].addControl({coordinates})
    },

    controlMoved (e) {
      const crs = this.map.file.getCrs()
      const projectedCoord = proj4(proj4.WGS84, projDef, e.coordinates)
      const coordinates = [
        (projectedCoord[0] - crs.easting) / crs.scale / mmToMeter,
        (projectedCoord[1] - crs.northing) / crs.scale / mmToMeter,
      ]
      this.event.courses[this.selectedCourse].moveControl({id: e.id, coordinates})
    },

    controlSelected (e) {
      this.selectedControl = e.id
    },

    controlDescriptionSet (e) {
      this.event.courses[this.selectedCourse].setControlDescription(e.controlId, e.kind, e.descriptionId)
    },

    controlRemoved (e) {
      this.event.courses[this.selectedCourse].removeControl(e.id)
    }
  },
  components: {
    MapView,
    Sidebar
  }
}

const mmToMeter = 0.001
const applyCrs = (crs, features) => {
  coordEach(features, c => {
    c[0] = c[0] * mmToMeter * crs.scale + crs.easting
    c[1] = c[1] * mmToMeter * crs.scale + crs.northing
  })
  return toWgs84(features, projDef)
}

</script>

<style>
  body {
    margin: 0;
    padding: 0;
  }

  .mu-drawer {
    top: 64px;
    z-index: 99;
  }

  .title {
    text-transform: uppercase;
    color: hsl(313, 50%, 60%);
  }

  .sidebar-wrapper {
    position: absolute;
    z-index: 1;
    right: 1rem;
    top: 1rem;
    padding: 1rem;
    width: 35em;
  }
</style>
