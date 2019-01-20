<template>
  <div
    ref="mapContainer"
    :class="{map: true, empty: empty}"
    @drop="onFileDropped"
    @dragover="$event.preventDefault()">
    <input v-if="empty" type="file" @change="onFileInput($event.target.files)" class="input-file">
    <div v-if="empty">
      <hero v-if="!loading" />
      <h1 v-else>
        {{ $t('messages.loadingMap') }}
      </h1>
    </div>
  </div>
</template>

<script>
import toBuffer from 'blob-to-buffer'
import mapboxgl from 'mapbox-gl'
import bbox from '@turf/bbox'
import { coordEach, coordReduce } from '@turf/meta'
import Hero from './Hero.vue'
import { startHover, controlCircles, finishInnerCircle, finishOuterCircle, controlTexts, controlConnections, start } from '../layer-defs'

mapboxgl.accessToken = process.env.VUE_APP_MAPBOX_TOKEN;

export default {
  name: 'MapView',
  components: { Hero },
  props: {
    controls: Object,
    controlTexts: Object,
    controlConnections: Object,
    otherControls: Object,
    layers: Array,
    mapGeojson: Object,
    mapRotation: Number,
    printScale: Number,
    mapScale: Number
  },
  data () {
    return {
      loading: false
    }
  },
  created () {
    this.sources = {}
  },
  mounted () {
    this.getMap()
  },
  computed: {
    empty () {
      return !this.layers || !this.layers.length
    },
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
          },
          otherControls: {
            type: 'geojson',
            data: {type: 'FeatureCollection', features: []}
          },
        },
        layers: this.layers.concat([
          {
            id: 'other-control-circles',
            source: 'otherControls',
            ...controlCircles(0.4)
          },
          {
            id: 'other-start-hover',
            source: 'otherControls',
            ...startHover(0.4)
          },
          {
            id: 'other-start',
            source: 'otherControls',
            ...start(0.4)
          },
          {
            id: 'other-finish-inner-circle',
            source: 'otherControls',
            ...finishInnerCircle(0.4)
          },
          {
            id: 'other-finish-outer-circle',
            source: 'otherControls',
            ...finishOuterCircle(0.4)
          },
          {
            id: 'start-hover',
            source: 'controls',
            ...startHover(0.7)
          },
          {
            id: 'start',
            source: 'controls',
            ...start(0.7)
          },
          {
            id: 'control-circles',
            source: 'controls',
            ...controlCircles(0.7)
          },
          {
            id: 'finish-inner-circle',
            source: 'controls',
            ...finishInnerCircle(0.7)
          },
          {
            id: 'finish-outer-circle',
            source: 'controls',
            ...finishOuterCircle(0.7)
          },
          {
            id: 'control-texts',
            source: 'controlTexts',
            ...controlTexts()
          },
          {
            id: 'control-connections',
            source: 'controlConnections',
            ...controlConnections()
          }
        ])
      }
    }
  },
  watch: {
    mapGeojson (geojson) {
      if (this.map) {
        this.map.fitBounds(bbox(geojson), { animate: false })
        this.map.setBearing(this.mapRotation, { animate: false })
      }
      this.loading = false
    },
    mapStyle (style) {
      const map = this.getMap()
      if (map) {
        map.setStyle(style)
      }
    },
    controls (controls) { this.updateSource('controls', controls) },
    controlTexts (controlTexts) { this.updateSource('controlTexts', controlTexts) },
    controlConnections (controlConnections) { this.updateSource('controlConnections', controlConnections) },
    otherControls (controls) { this.updateSource('otherControls', controls) },
  },
  methods: {
    onFileInput (files) {
      this.readFile(files[0])
    },
    onFileDropped (e) {
      e.preventDefault()
      if (e.dataTransfer.items) {
        for (var i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].kind === 'file') {
            this.readFile(e.dataTransfer.items[i].getAsFile())
            break
          }
        }

        e.dataTransfer.items.clear();
      }
    },
    readFile (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const blob = new Blob([reader.result], {type: 'application/octet-stream'})
        toBuffer(blob, (err, buffer) => {
          this.$emit('fileselected', {
            name: file.name,
            content: buffer
          })
        })
      }

      this.loading = true
      setTimeout(() => reader.readAsArrayBuffer(file), 100)
    },
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
        this.createFeatureHighlight('otherControls', 'other-start-hover', 'start')
        this.createFeatureHighlight('otherControls', 'other-control-circles')
        this.createFeatureHighlight('otherControls', 'other-finish-outer-circle')

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
      let c = 0
      const setData = () => {
        try {
          map.getSource(id).setData(data)
        } catch (e) {
          // This happens when the map has not initialized yet
          // Note: I have tried checking isStyleLoaded(), but it sometime (?!)
          // returns false even when the map style clearly _is_ loaded
          if (c++ < 3) {
            setTimeout(setData, 200)
          }
        }
      }

      if (map) {
        setData()
      }
    },
    onMapClick (e) {
      if (!this.hover) {
        this.$emit('controladded', { coordinates: [e.lngLat.lng, e.lngLat.lat] })
      } else if (this.hover.source === 'otherControls') {
        this.$emit('controladded', { id: this.hover.id })
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

</script>

<style scoped>
  .map {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .empty {
    background-image: url('../assets/topography.svg');
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h1 {
    color: hsl(200, 15%, 75%);
  }

  .input-file {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    cursor: pointer;
  }
</style>
