<template>
  <div id="app">
    <map-view
      v-if="layers && layers.length && mapGeojson && mapGeojson.features"
      :controls="event && event.courses && event.courses[selectedCourse].controls"
      :control-texts="event && event.courses && event.courses[selectedCourse].controlTexts"
      :control-connections="event && event.courses && event.courses[selectedCourse].connections"
      :layers="layers"
      :map-geojson="mapGeojson"/>
    <empty-map v-else @fileselected="mapFileSelected" />
    <div v-if="event && event.courses" class="course-list">
      <mu-paper :z-depth="1">
        <mu-list>
          <mu-list-item button @click="selectedCourse = i" v-for="(c, i) in event.courses" :key="i">
            <mu-list-item-title>{{c.name}}</mu-list-item-title>
          </mu-list-item>
        </mu-list>
      </mu-paper>
    </div>
  </div>
</template>

<script>
import MapView from './components/MapView.vue'
import EmptyMap from './components/EmptyMap.vue'
import parsePPen from './parse-ppen.js'
import { readOcad, ocadToGeoJson, ocadToMapboxGlStyle } from 'ocad2geojson'
import { toWgs84 } from 'reproject'

export default {
  name: 'app',
  data () {
    return {
      event: {},
      selectedCourse: 0,
      layers: [],
      mapGeojson: {}
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
  methods: {
    mapFileSelected(f) {
      readOcad(f.content)
        .then(ocadFile => {
          this.mapGeojson = Object.freeze(toWgs84(ocadToGeoJson(ocadFile), '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs'))
          this.layers = ocadToMapboxGlStyle(ocadFile, {source: 'map', sourceLayer: ''})
        })
        .catch(err => {
          console.error(err)
          this.error = err.message
          this.loading = false
        })
    }
  },
  components: {
    MapView,
    EmptyMap
  }
}

</script>

<style>
  body {
    margin: 0;
    padding: 0;
  }

  .course-list {
    position: absolute;
    right: 1rem;
    top: 1rem;
    padding: 1rem;
  }

  .course-list button {
    font-size: 24px;
  }
</style>
