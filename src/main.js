import Vue from 'vue'
import MuseUI from 'muse-ui';
import 'muse-ui/dist/muse-ui.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import App from './App.vue'

Vue.config.productionTip = false

Vue.use(MuseUI);

new Vue({
  render: h => h(App),
}).$mount('#app')
