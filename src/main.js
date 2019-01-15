import Vue from 'vue'
import MuseUI from 'muse-ui'
import theme from 'muse-ui/lib/theme';
import 'muse-ui/dist/muse-ui.css'
import 'mapbox-gl/dist/mapbox-gl.css'

import App from './App.vue'
import i18n from './i18n'
import store from './store'

Vue.config.productionTip = false

Vue.use(MuseUI)

theme.add('sketcher-theme', {
  primary: '#6A266F'
})

theme.use('sketcher-theme')

new Vue({
  render: h => h(App),
  store,
  i18n
}).$mount('#app')
