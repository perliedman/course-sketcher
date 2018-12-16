<template>
  <div id="app">
    <map-view :event="event" :layers="layers"/>
  </div>
</template>

<script>
import MapView from './components/MapView.vue'
import parsePPen from './parse-ppen.js'

export default {
  name: 'app',
  data () {
    return {
      event: {},
      layers: []
    }
  },
  created () {
    fetch('tiles/hp/layers.json')
      .then(res => res.json())
      .then(layers => {
        layers.forEach(l => {
          if (l.layout && l.layout['text-max-width'] === null) {
            l.layout['text-max-width'] = Infinity
          }
        })

        this.layers = Object.freeze(layers)
      })

    fetch('example-1.ppen')
      .then(res => res.text())
      .then(text => (new window.DOMParser()).parseFromString(text, "text/xml"))
      .then(doc => parsePPen(crs, doc))
      .then(event => {
        // console.log(JSON.stringify(event.controls, null, 2))
        this.event = Object.freeze(event)
      })
  },
  components: {
    MapView
  }
}

const crs = {
  scale: 15000,
  northing: 6404000,
  easting: 316000,
  proj: '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
}

</script>

<style>
  body {
    margin: 0;
    padding: 0;
  }
</style>
