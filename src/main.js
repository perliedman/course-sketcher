import Vue from 'vue'
import MuseUI from 'muse-ui'
import VueI18n from 'vue-i18n'
import 'muse-ui/dist/muse-ui.css'
import 'mapbox-gl/dist/mapbox-gl.css'

import App from './App.vue'
import messages from './i18n'

Vue.config.productionTip = false

Vue.use(VueI18n)
Vue.use(MuseUI)

const i18n = new VueI18n({
  locale: 'sv',
  messages
})

new Vue({
  render: h => h(App),
  i18n
}).$mount('#app')
