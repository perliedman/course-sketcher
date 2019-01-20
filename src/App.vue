<template>
  <div id="app" @keydown="onKeydown">
    <mu-appbar style="width: 100%" color="primary">
      <mu-button icon slot="left" :disabled="!map.file" @click="menuOpen = !menuOpen">
        <mu-icon value="menu"></mu-icon>
      </mu-button>
      <span class="title">
        Course Sketcher
      </span>
      <mu-menu cover placement="bottom-end" :open.sync="settingsOpen" slot="right">
        <mu-button icon>
          <mu-icon value="settings"></mu-icon>
        </mu-button>
        <mu-list slot="content">
          <mu-list-item v-for="lang in langs" button :key="lang.code" @click="$i18n.locale = lang.code">
            <mu-list-item-title><img :src="`flags/${lang.flag}.svg`" style="width: 16px;">{{lang.title}}</mu-list-item-title>
          </mu-list-item>
        </mu-list>
      </mu-menu>
    </mu-appbar>
    <mu-drawer v-if="map.file" :open.sync="menuOpen" :width=400>
      <sidebar
        :event="event"
        :map="map"
        :selected-course="selectedCourseIndex"
        :selected-control-id="selectedControl"
        @courseselected="setSelectedCourse($event)"
        @controldescriptionset="controlDescriptionSet"
        @controlremoved="controlRemoved"
        @controlkindset="controlKindSet"
        @courseadded="addCourse"
        @eventnameset="setEventName"
        @coursenameset="setCourseName"
      />
    </mu-drawer>
    <map-view
      :controls="controlsGeoJson"
      :control-texts="controlLabelsGeoJson"
      :control-connections="controlCollectionsGeoJson"
      :layers="layers"
      :map-geojson="mapGeojson"
      :map-rotation="mapRotation"
      :map-scale="crs && crs.scale"
      :print-scale="selectedCourse.printScale"
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
import { mapState, mapGetters, mapMutations } from 'vuex'
import Sidebar from './components/Sidebar.vue'
import MapView from './components/MapView.vue'
import parsePPen from './parse-ppen.js'
import { readOcad, ocadToGeoJson, ocadToMapboxGlStyle } from 'ocad2geojson'
import { toWgs84 } from 'reproject'
import proj4 from 'proj4'
import bbox from '@turf/bbox'

import { featureCollection } from '@turf/helpers'
import { coordEach } from '@turf/meta'

import { MOVE_CONTROL, REMOVE_CONTROL, SELECT_CONTROL, SET_CONTROL_DESCRIPTION, SET_CONTROL_KIND, ADD_COURSE_CONTROL, ADD_EVENT_CONTROL, ADD_COURSE, SET_SELECTED_COURSE, SET_EVENT_NAME, SET_COURSE_NAME } from './store/mutation-types'
import { languages } from './i18n'

// Since the actual geographic coordinates do not have any significance (yet?), just about any CRS will do
const projDef = '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs'

export default {
  name: 'app',
  data () {
    return {
      map: {},
      layers: [],
      mapGeojson: {},
      mapRotation: 0,
      menuOpen: true,
      message: undefined,
      settingsOpen: false,
      langs: languages
    }
  },
  computed: {
    controlsGeoJson () {
      // TODO: this hack forces the computed value to depend on each control's kind,
      // which it should, but would be nice if this could be done in a less hacky way
      this.selectedCourse.controls.map(c => c.kind)
      const f = this.selectedCourse.controlsToGeoJson() || featureCollection([])
      return this.event && this.event.courses && this.map.file && applyCrs(this.map.file.getCrs(), f)
    },
    controlLabelsGeoJson () {
      // TODO: this hack forces the computed value to depend on each control's kind,
      // which it should, but would be nice if this could be done in a less hacky way
      this.selectedCourse.controls.map(c => c.kind)
      return this.event && this.event.courses && this.map.file && applyCrs(this.map.file.getCrs(), this.selectedCourse.controlLabelsToGeoJson() || featureCollection([]))
    },
    controlCollectionsGeoJson () {
      return this.event && this.event.courses && this.map.file && applyCrs(this.map.file.getCrs(), this.selectedCourse.controlConnectionsToGeoJson() || featureCollection([]))
    },
    crs () {
      return this.map.file && this.map.file.getCrs()
    },
    ...mapState(['event', 'selectedCourseIndex', 'selectedControl']),
    ...mapGetters(['selectedCourse'])
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
            if (this.event) {
              this.event.courses.forEach(c => {
                c.mapScale = this.map.file.getCrs().scale
              })
              if (this.event.map && this.map.name != this.event.map.name) {
                this.message = this.$t('messages.ensureCorrectMap', { fileName: this.event.map.name })
              }
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
            this.message = this.$t('messages.ensureCorrectMap', { fileName: this.event.map.name })
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
      
      this.addEventControl({ coordinates, kind: this.event.idGenerator.current() === 0 ? 'start' : 'normal' })
      this.addCourseControl({ id: this.event.idGenerator.current() })
    },

    controlMoved (e) {
      const crs = this.map.file.getCrs()
      const projectedCoord = proj4(proj4.WGS84, projDef, e.coordinates)
      const coordinates = [
        (projectedCoord[0] - crs.easting) / crs.scale / mmToMeter,
        (projectedCoord[1] - crs.northing) / crs.scale / mmToMeter,
      ]
      this.moveControl({ id: e.id, coordinates })
    },

    controlSelected ({ id }) {
      this.selectControl({ id })
    },

    controlDescriptionSet (e) {
      this.setControlDescription({ id: e.controlId, kind: e.kind, descriptionId: e.descriptionId })
    },

    controlRemoved ({ id }) {
      this.removeControl({ id })
    },

    controlKindSet ({ id, kind }) {
      this.setControlKind({ id, kind })
    },

    onKeydown (e) {
      if (e.ctrlKey) {
        if (e.key === 'z' && this.canUndo) {
          this.undo()
        } else if (e.key === 'y' && this.canRedo) {
          this.redo()
        }
      }
    },

    ...mapMutations({
      addEventControl: ADD_EVENT_CONTROL,
      addCourseControl: ADD_COURSE_CONTROL,
      moveControl: MOVE_CONTROL,
      removeControl: REMOVE_CONTROL,
      selectControl: SELECT_CONTROL,
      setControlDescription: SET_CONTROL_DESCRIPTION,
      setControlKind: SET_CONTROL_KIND,
      addCourse: ADD_COURSE,
      setSelectedCourse: SET_SELECTED_COURSE,
      setEventName: SET_EVENT_NAME,
      setCourseName: SET_COURSE_NAME
    })
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
