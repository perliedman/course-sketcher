<template>
  <div class="map" ref="mapContainer">
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'

export default {
  name: 'TrackView',
  props: {
    track: Object,
    layers: Array,
    replay: {
      type: Boolean,
      default: true
    },
    replaySpeedFactor: {
      type: Number,
      default: 10
    },
    replayTrailLength: {
      type: Number,
      default: 60 * 1000
    }
  },
  mounted () {
    this.getMap()
  },
  computed: {
    mapStyle () {
      return {
        version: 8,
        name: 'OCAD demo',
        sources: {
          map: {
            type: 'vector',
            tiles: ['http://localhost:8080/tiles/hp/{z}/{x}/{y}.pbf'],
            maxzoom: 14
          }
        },
        layers: this.layers
      }
    }
  },
  watch: {
    mapStyle (style) {
      const map = this.getMap()
      if (map) {
        map.setStyle(style)
      }
    },
    track () {
      this.resetReplay()
    }
  },
  methods: {
    getMap () {
      if (!this.map && this.layers && this.layers.length) {
        this.map = new mapboxgl.Map({
          container: this.$refs.mapContainer,
          style: this.mapStyle
        })

        this.replayTrail = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }

        this.map.jumpTo({
          center: [11.93, 57.75],
          zoom: 14
        })
      }

      return this.map
    },
    resetReplay () {
      const trackFeature = this.track.features[0]
      const coordTimes = trackFeature.properties.coordTimes
        .map((t, i) => ({t: +new Date(t), i}))

      this.replayContext = {
        trackFeature,
        currentCoords: [],
        currentTimes: [],
        currentBearing: 0,
        currentPitch: 0,
        firstIndex: 0,
        lastIndex: 0,
        lastUpdate: +new Date(),
        coordTimes,
        clock: new Clock(coordTimes[0].t)
      }

      const map = this.getMap()
      if (map) {
        if (!map.isStyleLoaded()) {
          map.once('load', this.updateReplay.bind(this))
        } else {
          this.updateReplay()
        }
      }
    },
    updateReplay () {
      const map = this.getMap()
      if (!map.getLayer('replay-trail')) {
        this.map.addLayer({
          id: 'replay-trail',
          type: 'line',
          source: {
            type: 'geojson',
            data: this.replayTrail
          },
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
              "line-color": "#a00",
              "line-width": {
                'type': 'exponential',
                'base': 2,
                'stops': [
                  [0, 12 * Math.pow(2, (0 - 16))],
                  [24, 12 * Math.pow(2, (24 - 16))]
                ]
              },
              "line-opacity": 0.85
          }
        })
      }

      const trackT = this.replayContext.clock.getTime(this.replaySpeedFactor)

      this.updateReplayTrail(trackT)

      if (this.replay) {
        requestAnimationFrame(this.updateReplay.bind(this))
      }
    },
    updateReplayTrail (trackT) {
      const map = this.getMap()
      const ctx = this.replayContext
      const minT = trackT - this.replayTrailLength
      let { currentCoords, currentTimes, coordTimes } = ctx

      for (var firstIndex = 0; firstIndex < currentTimes.length && currentTimes[firstIndex] < minT; firstIndex++) {}
      if (firstIndex > 0) {
        ctx.currentCoords = currentCoords = currentCoords.slice(firstIndex)
        ctx.currentTimes = currentTimes = currentTimes.slice(firstIndex)
      }

      while (ctx.lastIndex < coordTimes.length - 2 && coordTimes[ctx.lastIndex + 1].t <= trackT) {
        ctx.lastIndex++
        currentCoords.push(ctx.trackFeature.geometry.coordinates[ctx.lastIndex])
        currentTimes.push(coordTimes[ctx.lastIndex].t)
      }

      const lastT = coordTimes[ctx.lastIndex].t
      const lastC = ctx.trackFeature.geometry.coordinates[ctx.lastIndex]
      const nextT = coordTimes[ctx.lastIndex + 1].t
      const nextC = ctx.trackFeature.geometry.coordinates[ctx.lastIndex + 1]
      const dLng = nextC[0] - lastC[0]
      const dLat = nextC[1] - lastC[1]
      const dT = nextT - lastT
      const d = Math.min((trackT - lastT) / dT, 1)
      const interpolatedCoord = [
        lastC[0] + dLng * d,
        lastC[1] + dLat * d,
      ]

      currentCoords.push(interpolatedCoord)
      currentTimes.push(trackT)

      this.replayTrail.geometry.coordinates = currentCoords
      map.getSource('replay-trail').setData(this.replayTrail);
    }
  }
}

class Clock {
  constructor (start) {
    this.start = start
    this.t = start
    this.paused = false
    this.lastUpdate = null
  }

  getTime (factor) {
    if (this.paused) {
      return this.t
    }

    const now = +new Date()
    const dt = this.lastUpdate ? now - this.lastUpdate : 0
    this.t += dt * factor

    this.lastUpdate = now

    return this.t
  }
}

</script>

<style scoped>
  @import url(~/mapbox-gl/dist/mapbox-gl.css);
  
  .map {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
