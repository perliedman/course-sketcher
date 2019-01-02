<template>
  <div id="app">
    <div v-if="layers && layers.length && mapGeojson && mapGeojson.features">
      <div class="sidebar-wrapper">
        <sidebar
          :event="event"
          :map="map"
          :selected-control-id="selectedControl"
          @controldescriptionset="controlDescriptionSet"
          @controlremoved="controlRemoved" />
      </div>
      <map-view
        :controls="controlsGeoJson"
        :control-texts="controlLabelsGeoJson"
        :control-connections="controlCollectionsGeoJson"
        :layers="layers"
        :map-geojson="mapGeojson"
        :map-rotation="mapRotation"
        @controladded="controlAdded"
        @controlmoved="controlMoved"
        @controlselected="controlSelected"/>
    </div>
    <empty-map v-else @fileselected="mapFileSelected" />
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import MapView from './components/MapView.vue'
import EmptyMap from './components/EmptyMap.vue'
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
      mapRotation: 0
    }
  },
  created () {
    // fetch('tiles/hp/layers.json')
    //   .then(res => res.json())
    //   .then(layers => {
    //     layers.forEach(l => {
    //       if (l.layout && l.layout['text-max-width'] === null) {
    //         l.layout['text-max-width'] = Infinity
    //       }
    //     })

    //     this.layers = Object.freeze(layers)
    //   })

    // fetch('example-1.ppen')
    //   .then(res => res.text())
    //   .then(text => (new window.DOMParser()).parseFromString(text, "text/xml"))
    //   .then(doc => parsePPen(crs, doc))
    //   .then(event => {
    //     // console.log(JSON.stringify(event.controls, null, 2))
    //     this.event = event
    //   })
  },
  computed: {
    controlsGeoJson () {
      const f = this.event.courses[this.selectedCourse].controlsToGeoJson() || featureCollection([])
      return this.event && this.event.courses && this.map && applyCrs(this.map.file.getCrs(), f)
    },
    controlLabelsGeoJson () {
      return this.event && this.event.courses && this.map && applyCrs(this.map.file.getCrs(), this.event.courses[this.selectedCourse].controlLabelsToGeoJson() || featureCollection([]))
    },
    controlCollectionsGeoJson () {
      return this.event && this.event.courses && this.map && applyCrs(this.map.file.getCrs(), this.event.courses[this.selectedCourse].controlConnectionsToGeoJson() || featureCollection([]))
    }
  },
  methods: {
    mapFileSelected(f) {
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
            file: ocadFile 
          }
        })
        .catch(err => {
          console.error(err)
          this.error = err.message
          this.loading = false
        })
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
    EmptyMap,
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

  .sidebar-wrapper {
    position: absolute;
    z-index: 1;
    right: 1rem;
    top: 1rem;
    padding: 1rem;
    width: 32em;
  }
</style>
