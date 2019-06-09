<template>
  <div id="app" @keydown="onKeydown">
    <mu-appbar style="width: 100%" color="primary">
      <mu-button icon slot="left" :disabled="!map.file" @click="menuOpen = !menuOpen">
        <mu-icon value="menu"></mu-icon>
      </mu-button>
      <span class="title">
        Course Sketcher
      </span>
      <mu-button icon title="Undo" :disabled="!canUndo" @click="undo" slot="right">
        <mu-icon value="undo"></mu-icon>
      </mu-button>
      <mu-button icon title="Redo" :disabled="!canRedo" @click="redo" slot="right">
        <mu-icon value="redo"></mu-icon>
      </mu-button>
      <mu-menu cover placement="bottom-end" :open.sync="settingsOpen" slot="right">
        <mu-button icon>
          <mu-icon value="settings"></mu-icon>
        </mu-button>
        <mu-list slot="content">
          <mu-list-item v-for="lang in langs" button :key="lang.code" @click="setLang(lang.code)">
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
        @controlremoved="removeControl"
        @controldeleted="deleteControl"
        @controlkindset="setControlKind"
        @courseadded="addCourse"
        @eventnameset="setEventName"
        @coursenameset="setCourseName"
        @printscaleset="setPrintScale"
        @filesdropped="filesDropped"
        @removemap="removeMap"
      />
    </mu-drawer>
    <map-view
      :controls="controlsGeoJson"
      :control-texts="controlLabelsGeoJson"
      :control-connections="controlCollectionsGeoJson"
      :other-controls="otherControlsGeoJson"
      :layers="layers"
      :map-geojson="mapGeojson"
      :map-rotation="mapRotation"
      :map-scale="crs && crs.scale"
      :print-scale="selectedCourse.printScale"
      :loading="loading"
      @controladded="controlAdded"
      @controlmoved="controlMoved"
      @controlselected="controlSelected"
      @filesdropped="filesDropped"/>
    <mu-snackbar position="bottom" :open="!!message">
      <span v-html="message" />
      <mu-button flat slot="action" color="secondary" @click="message = undefined">{{$t('actions.close')}}</mu-button>
    </mu-snackbar>
    <mu-snackbar v-if="restoredEvent" position="bottom" :open="!!restoredEvent">
      <span>{{$t('messages.restoreAvailable')}}</span>
      <mu-button flat slot="action" color="secondary" @click="setEvent(restoredEvent); restoredEvent = null">{{$t('actions.yes')}}</mu-button>
      <mu-button flat slot="action" color="secondary" @click="restoredEvent = null">{{$t('actions.no')}}</mu-button>
    </mu-snackbar>
  </div>
</template>

<script>
import toBuffer from 'blob-to-buffer'
import { mapState, mapGetters, mapMutations } from 'vuex'
import Sidebar from './components/Sidebar.vue'
import MapView from './components/MapView.vue'
import { parsePPen, writePpen } from './ppen.js'
import { parseOcadEvent } from './ocad'
import { readOcad, ocadToGeoJson, ocadToMapboxGlStyle } from 'ocad2geojson'
import { toWgs84 } from 'reproject'
import proj4 from 'proj4'
import bbox from '@turf/bbox'
import FileSaver from 'file-saver'

import { featureCollection } from '@turf/helpers'
import { coordEach } from '@turf/meta'

import { MOVE_CONTROL, REMOVE_CONTROL, SELECT_CONTROL, SET_CONTROL_DESCRIPTION, SET_CONTROL_KIND, ADD_COURSE_CONTROL, ADD_EVENT_CONTROL, ADD_COURSE, SET_SELECTED_COURSE, SET_EVENT_NAME, SET_COURSE_NAME, SET_PRINT_SCALE, SET_EVENT, DELETE_CONTROL, CHECKPOINT, SET_MAP, SET_MAP_SCALE } from './store/mutation-types'
import { languages } from './i18n'
import storage from './storage'

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
      langs: languages,
      loading: false,
      restoredEvent: null
    }
  },
  mounted () {
    const lastEvent = storage.get('event.ppen')
    if (lastEvent) {
      const doc = new DOMParser().parseFromString(lastEvent, 'application/xml')
      this.restoredEvent = parsePPen(doc)
    }

    let saveTimeout
    let undoTimeout

    this.$store.subscribe(
      (mutation, state) => {
        if (mutation.type !== CHECKPOINT) {
          clearTimeout(undoTimeout)
          undoTimeout = setTimeout(() => this.checkpoint(), 100)
        }

        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          const doc = writePpen(state.event)
          storage.set('event.ppen', new XMLSerializer().serializeToString(doc))
        }, 5000)
      })
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
    otherControlsGeoJson () {
      return this.event && this.event.courses && this.map.file &&
        applyCrs(this.map.file.getCrs(), {
          type: 'FeatureCollection',
          features: this.event.controlList
            .filter(eventControl => !this.selectedCourse.controls.some(courseControl => courseControl.id === eventControl.id))
            .map(control => control.toGeoJson(10000/15000, 0))
        })
    },
    crs () {
      return this.map.file && this.map.file.getCrs()
    },
    ...mapState(['event', 'selectedCourseIndex', 'selectedControl']),
    ...mapGetters(['selectedCourse'])
  },
  methods: {
    setLang (code) {
      this.$i18n.locale = code
      storage.set('ui.lang', code)
    },
    filesDropped ({ files }) {
      this.loading = true
      const loadPromises = files.map(this.readFile.bind(this))
      Promise.all(loadPromises)
        .then(() => {
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },
    readFile (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const blob = new Blob([reader.result], {type: 'application/octet-stream'})
          toBuffer(blob, (err, buffer) => {
            resolve(this.mapFileSelected({
              name: file.name,
              content: buffer
            }))
          })
        }

        setTimeout(() => reader.readAsArrayBuffer(file), 100)
      })
    },
    mapFileSelected(f) {
      this.message = undefined
      if (f.name.toLowerCase().endsWith('.ocd')) {
        return readOcad(f.content)
          .then(ocadFile => {
            const isCourseSettingProject = ocadFile.header.fileType === 1

            const mapGeojson = Object.freeze(toWgs84(ocadToGeoJson(ocadFile), projDef))
            const [minLng, minLat, maxLng, maxLat] = bbox(mapGeojson)
            const [minX, minY] = proj4(proj4.WGS84, projDef, [minLng, minLat])
            const [maxX, maxY] = proj4(proj4.WGS84, projDef, [minLng, maxLat])
            const mapRotation = Math.atan2(maxY - minY, maxX - minX) / Math.PI * 180 - 90

            if (!isCourseSettingProject || !this.map.file) {
              this.map = {
                name: f.name,
                file: Object.freeze(ocadFile) 
              }
              this.mapRotation = mapRotation
            }

            if (!isCourseSettingProject) {
              this.mapGeojson = mapGeojson
              this.layers = ocadToMapboxGlStyle(ocadFile, {source: 'map', sourceLayer: ''})
            } else {
              // OCAD course setting project
              this.setEvent(parseOcadEvent(ocadFile))

              if (!this.mapGeojson.features) {
                this.mapGeojson = {
                  type: 'FeatureCollection',
                  features: []
                }
              }

              if (this.layers.length === 0) {
                this.layers.push({id: 'dummy', type: 'symbol', source: 'map'})
              }
            }
          })
          .then(() => {
            if (this.event) {
              const scale = this.map.file.getCrs().scale
              this.setMap({ name: this.map.name, scale })
              this.event.courses.forEach(c => {
                this.setMapScale({ id: c.id, scale })
              })
              if (this.event.map && this.event.map.name && this.map.name != this.event.map.name) {
                this.message = this.$t('messages.ensureCorrectMap', { fileName: this.event.map.name })
              }
            }
          })
          .catch(err => {
            console.error(err)
            this.message = this.$t('messages.mapLoadError', {error: err.message}) 
          })
      } else if (f.name.toLowerCase().endsWith('.ppen')) {
        const doc = new DOMParser().parseFromString(f.content, 'application/xml')
        try {
          this.setEvent(parsePPen(doc))
        } catch (err) {
          this.message = this.$t('messages.mapLoadError', {error: err.message}) 
        }
      } else {
        this.message = this.$t('messages.unknownFileType') 
      }
    },
    controlAdded (e) {
      let id

      if (!e.id) {
        const crs = this.map.file.getCrs()
        const projectedCoord = proj4(proj4.WGS84, projDef, e.coordinates)
        const coordinates = [
          (projectedCoord[0] - crs.easting) / crs.scale / mmToMeter,
          (projectedCoord[1] - crs.northing) / crs.scale / mmToMeter,
        ]
        
        this.addEventControl({ coordinates, kind: Object.keys(this.event.controls).length === 0 ? 'start' : 'normal' })
        id = this.event.idGenerator.current()
      } else {
        id = e.id
      }

      this.addCourseControl({ id })
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

    onKeydown (e) {
      if (e.ctrlKey) {
        if (e.key === 'z' && this.canUndo) {
          this.undo()
        } else if (e.key === 'y' && this.canRedo) {
          this.redo()
        } else if (e.key === 's') {
          const xml = new XMLSerializer().serializeToString(writePpen(this.event))
          const blob = new Blob([xml], {type: "text/xml;charset=utf-8"})
          FileSaver.saveAs(blob, `${this.event.name}.ppen`);
          e.preventDefault()
        }
      }
    },

    setEvent (event) {
      this.setEventInStore({ event })
      if (!this.map.name) {
        this.message = this.$t('messages.mapFileRequest', { fileName: this.event.map.name })
      } else if (this.map.name != this.event.map.name) {
        this.message = this.$t('messages.ensureCorrectMap', { fileName: this.event.map.name })
      }
    },

    removeMap () {
      this.map = {}
      this.mapGeojson = {}
      this.layers = []
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
      setCourseName: SET_COURSE_NAME,
      setEventInStore: SET_EVENT,
      deleteControl: DELETE_CONTROL,
      setPrintScale: SET_PRINT_SCALE,
      setMap: SET_MAP,
      setMapScale: SET_MAP_SCALE,
      checkpoint: CHECKPOINT
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
