<template>
  <div :class="{map: true, 'empty-map': !layers || !layers.length}" ref="mapContainer">
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
import { coordEach, coordReduce } from '@turf/meta'

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
  created () {
    this.sources = {}
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
            id: 'start-hover',
            source: 'controls',
            filter: ['==', ['get', 'kind'], 'start'],
            type: 'fill',
            paint: {
              'fill-opacity': 0
            }
          },
          {
            id: 'start',
            source: 'controls',
            filter: ['==', ['get', 'kind'], 'start'],
            type: 'line',
            paint: {
              'line-opacity': ["case",
                ["boolean", ["feature-state", "hover"], false],
                    1,
                    0.7
                ],
              'line-color': '#fb3199',
              'line-width': expFunc(4)
            }
          },
          {
            id: 'control-circles',
            source: 'controls',
            filter: ['==', ['get', 'kind'], 'control'],
            type: 'circle',
            paint: {
              'circle-radius': expFunc(28),
              'circle-opacity': 0,
              'circle-stroke-width': expFunc(4),
              'circle-stroke-color': '#fb3199',
              'circle-stroke-opacity': ["case",
                ["boolean", ["feature-state", "hover"], false],
                    1,
                    0.7
                ],
              'circle-pitch-scale': 'map',
              'circle-pitch-alignment': 'map'
            }
          },
          {
            id: 'finish-inner-circle',
            source: 'controls',
            filter: ['==', ['get', 'kind'], 'finish'],
            type: 'circle',
            paint: {
              'circle-radius': expFunc(22.4),
              'circle-opacity': 0,
              'circle-stroke-width': expFunc(4),
              'circle-stroke-color': '#fb3199',
              'circle-stroke-opacity': 0.7,
              'circle-pitch-scale': 'map',
              'circle-pitch-alignment': 'map'
            }
          },
          {
            id: 'finish-outer-circle',
            source: 'controls',
            filter: ['==', ['get', 'kind'], 'finish'],
            type: 'circle',
            paint: {
              'circle-radius': expFunc(33.6),
              'circle-opacity': 0,
              'circle-stroke-width': expFunc(4),
              'circle-stroke-color': '#fb3199',
              'circle-stroke-opacity': ["case",
                ["boolean", ["feature-state", "hover"], false],
                    1,
                    0.7
                ],
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
              'text-color': '#fb3199',
              'text-opacity': 0.8
            }
          },
          {
            id: 'control-connections',
            source: 'controlConnections',
            type: 'line',
            paint: {
              'line-color': '#fb3199',
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

        this.map
          .on('click', this.onMapClick.bind(this))

        this.createFeatureHighlight('controls', 'start-hover', 'start')
        this.createFeatureHighlight('controls', 'control-circles')
        this.createFeatureHighlight('controls', 'finish-outer-circle')

        this.map.on('mousedown', this.onMouseDown.bind(this))

        if (this.mapGeojson && this.mapGeojson.features) {
          this.map.once('load', () => {
            this.map.fitBounds(bbox(this.mapGeojson), { padding: 20, animate: false })
            this.map.setBearing(this.mapRotation)
          })
        }
      }

      return this.map
    },
    setSelection ({source, id}) {
        if (this.selection && (this.selection.source !== this.hover.source || this.selection.id !== this.hover.id)) {
          this.map.setFeatureState({source: this.selection.source, id: this.selection.id }, { hover: false })
        }

        this.selection = { source, id }
    },
    updateSource (id, data) {
      this.sources[id] = data

      const map = this.getMap()
      const setData = () => {
        map.getSource(id).setData(data)
      }

      if (map) {
        setData()
      }
    },
    onMapClick (e) {
      if (!this.hover) {
        this.$emit('controladded', { coordinates: [e.lngLat.lng, e.lngLat.lat] })
      }
    },
    onMouseDown (e) {
      if (this.hover) {
        this.setSelection(this.hover)
        this.$emit('controlselected', { id: this.selection.id })

        let lastLngLat = e.lngLat
        const source = this.map.getSource(this.hover.source)
        const sourceData = this.sources[this.hover.source]
        const feature = sourceData.features.find(f => f.id === this.hover.id)

        const dragFeature = e => {
          const delta = [e.lngLat.lng - lastLngLat.lng, e.lngLat.lat - lastLngLat.lat]
          coordEach(feature, c => {
            c[0] += delta[0]
            c[1] += delta[1]
          })

          source.setData(sourceData)
          lastLngLat = e.lngLat
        }
        this.map.on('mousemove', dragFeature)
        this.map.once('mouseup', () => {
          const sumCoord = coordReduce(feature, (a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0])
          const nCoord = coordReduce(feature, (a, _) => a + 1, 0)
          this.$emit('controlmoved', {
            id: feature.id,
            coordinates: [sumCoord[0] / nCoord, sumCoord[1] / nCoord]
          })
          this.map.off('mousemove', dragFeature)
        })
      }
    },
    createFeatureHighlight (source, layer) {
      this.map.on('mousemove', layer, e => {
        if (e.features.length > 0) {
          if (this.hover) {
            this.map.setFeatureState({source: this.hover.source, id: this.hover.id}, { hover: false })
          }
          this.hover = { source, id: e.features[0].id }
          this.map.dragPan.disable()
          this.map.setFeatureState({source, id: this.hover.id}, { hover: true })
        }
      })

      this.map.on('mouseleave', layer, e => {
        if (this.hover && this.hover.source === source) {

          if (!this.selection || this.selection.source !== source || this.selection.id !== this.hover.id) {
            this.map.setFeatureState({source, id: this.hover.id}, { hover: false })
          }

          this.hover = null
          this.map.dragPan.enable()
        }
      })
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
