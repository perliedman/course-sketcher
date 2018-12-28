<template>
  <div :class="{map: true, 'empty-map': !layers || !layers.length}" ref="mapContainer">
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
mapboxgl.accessToken = 'pk.eyJ1IjoibGllZG1hbiIsImEiOiJZc3U4UXowIn0.d4yPyJ_Bl7CAROv15im36Q';

export default {
  name: 'MapView',
  props: {
    controls: Object,
    controlTexts: Object,
    controlConnections: Object,
    layers: Array,
    mapGeojson: Object,
    mapRotation: Number
  },
  mounted () {
    this.getMap()
  },
  computed: {
    mapStyle () {
      return {
        version: 8,
        name: 'OCAD demo',
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
          map: {
            type: 'geojson',
            data: this.mapGeojson
          },
          controls: {
            type: 'geojson',
            data: {type: 'FeatureCollection', features: []}
          },
          controlTexts: {
            type: 'geojson',
            data: {type: 'FeatureCollection', features: []}
          },
          controlConnections: {
            type: 'geojson',
            data: {type: 'FeatureCollection', features: []}
          }
        },
        layers: this.layers.concat([
          {
            id: 'control-circles',
            source: 'controls',
            type: 'circle',
            paint: {
              'circle-radius': expFunc(28),
              'circle-opacity': 0,
              'circle-stroke-width': expFunc(4),
              'circle-stroke-color': '#aa0055',
              'circle-stroke-opacity': 0.7,
              'circle-pitch-scale': 'map',
              'circle-pitch-alignment': 'map'
            }
          },
          {
            id: 'control-texts',
            source: 'controlTexts',
            type: 'symbol',
            layout: {
              'symbol-placement': 'point',
              'text-field': ['get', 'sequence'],
              'text-size': expFunc(48),
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true
            },
            paint: {
              'text-color': '#aa0055',
              'text-opacity': 0.8
            }
          },
          {
            id: 'control-connections',
            source: 'controlConnections',
            type: 'line',
            paint: {
              'line-color': '#aa0055',
              'line-opacity': 0.7,
              'line-width': expFunc(4)
            }
          }
        ])
      }
    }
  },
  watch: {
    mapGeojson (geojson) {
      if (this.map) {
        this.map.fitBounds(bbox(geojson))
      }      
    },
    mapStyle (style) {
      const map = this.getMap()
      if (map) {
        map.setStyle(style)
      }
    },
    controls (controls) { this.updateSource('controls', controls) },
    controlTexts (controlTexts) { this.updateSource('controlTexts', controlTexts) },
    controlConnections (controlConnections) { this.updateSource('controlConnections', controlConnections) }
  },
  methods: {
    getMap () {
      if (!this.map && this.layers && this.layers.length) {
        this.map = new mapboxgl.Map({
          container: this.$refs.mapContainer,
          style: this.mapStyle
        })

        if (this.mapGeojson && this.mapGeojson.features) {
          this.map.once('load', () => {
            this.map.fitBounds(bbox(this.mapGeojson), { padding: 20, animate: false })
            console.log(this.mapRotation)
            this.map.setBearing(this.mapRotation)
          })
        }
      }

      return this.map
    },
    updateSource (id, data) {
      const map = this.getMap()
      const setData = () => {
        map.getSource(id).setData(data)
      }

      if (map) {
        if (map.isStyleLoaded()) {
          setData()
        } else {
          map.once('load', setData)
        }
      }
    }
  }
}

const zoom0 = Math.pow(2, (0 - 15))
const zoom24 = Math.pow(2, (24 - 15))

const expFunc = base => ({
  'type': 'exponential',
  'base': 2,
  'stops': [
    [0, !base.length ? base * zoom0 : base.map(x => x * zoom0)],
    [24, !base.length ? base * zoom24 : base.map(x => x * zoom24)]
  ]
})
</script>

<style scoped>
  .map {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
