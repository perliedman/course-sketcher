<template>
  <div id="app">
    <track-view :track="track" :layers="layers"/>
  </div>
</template>

<script>
import TrackView from './components/TrackView.vue'
import { gpx } from '@mapbox/togeojson'

export default {
  name: 'app',
  data () {
    return {
      track: {},
      layers: []
    }
  },
  created () {
    fetch('tiles/hp/layers.json')
      .then(res => res.json())
      .then(layers => {
        this.layers = Object.freeze(layers)
      })

    fetch('example.gpx')
      .then(res => res.text())
      .then(text => (new window.DOMParser()).parseFromString(text, "text/xml"))
      .then(doc => gpx(doc))
      .then(track => {
        this.track = Object.freeze(track)
      })
  },
  components: {
    TrackView
  }
}
</script>

<style>
  body {
    margin: 0;
    padding: 0;
  }
</style>
