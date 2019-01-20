export const controlColor = 'hsl(329, 96%, 39%)'

// TODO: this is really a setting
const scaleFactor = 10000/15000

const zoom0 = Math.pow(2, (0 - 15))
const zoom24 = Math.pow(2, (24 - 15))

export const expFunc = base => ({
  'type': 'exponential',
  'base': 2,
  'stops': [
    [0, !base.length ? base * zoom0 : base.map(x => x * zoom0)],
    [24, !base.length ? base * zoom24 : base.map(x => x * zoom24)]
  ]
})

export const startHover = () => ({
  filter: ['==', ['get', 'kind'], 'start'],
  type: 'fill',
  paint: {
    'fill-opacity': 0
  }
})

export const start = (opacityFactor) => ({
  filter: ['==', ['get', 'kind'], 'start'],
  type: 'line',
  paint: {
    'line-opacity': ["case",
      ["boolean", ["feature-state", "hover"], false],
          1,
          opacityFactor
      ],
    'line-color': controlColor,
    'line-width': expFunc(6 * scaleFactor)
  }
})

export const controlCircles = (opacityFactor) => ({
  filter: ['==', ['get', 'kind'], 'normal'],
  type: 'circle',
  paint: {
    'circle-radius': expFunc(42 * scaleFactor),
    'circle-opacity': 0,
    'circle-stroke-width': expFunc(6 * scaleFactor),
    'circle-stroke-color': controlColor,
    'circle-stroke-opacity': ["case",
      ["boolean", ["feature-state", "hover"], false],
          1,
          opacityFactor
      ],
    'circle-pitch-scale': 'map',
    'circle-pitch-alignment': 'map'
  }
})

export const finishInnerCircle = (opacityFactor) => ({
  filter: ['==', ['get', 'kind'], 'finish'],
  type: 'circle',
  paint: {
    'circle-radius': expFunc(33.6 * scaleFactor),
    'circle-opacity': 0,
    'circle-stroke-width': expFunc(6 * scaleFactor),
    'circle-stroke-color': controlColor,
    'circle-stroke-opacity': ["case",
      ["boolean", ["feature-state", "hover"], false],
          1,
          opacityFactor
      ],
    'circle-pitch-scale': 'map',
    'circle-pitch-alignment': 'map'
  }
})

export const finishOuterCircle = (opacityFactor) => ({
  filter: ['==', ['get', 'kind'], 'finish'],
  type: 'circle',
  paint: {
    'circle-radius': expFunc(50.4 * scaleFactor),
    'circle-opacity': 0,
    'circle-stroke-width': expFunc(6 * scaleFactor),
    'circle-stroke-color': controlColor,
    'circle-stroke-opacity': ["case",
      ["boolean", ["feature-state", "hover"], false],
          1,
          opacityFactor
      ],
    'circle-pitch-scale': 'map',
    'circle-pitch-alignment': 'map'
  }
})

export const controlTexts = () => ({
  type: 'symbol',
  layout: {
    'symbol-placement': 'point',
    'text-field': ['get', 'label'],
    'text-size': expFunc(72 * scaleFactor),
    'text-anchor': 'center',
    'text-allow-overlap': true,
    'text-ignore-placement': true
  },
  paint: {
    'text-color': controlColor,
    'text-opacity': 0.8
  }
})

export const controlConnections = () => ({
  type: 'line',
  paint: {
    'line-color': controlColor,
    'line-opacity': 0.7,
    'line-width': expFunc(6 * scaleFactor)
  }
})
