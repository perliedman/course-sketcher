import { configure } from '@storybook/vue';

import Vue from 'vue';
import MuseUI from 'muse-ui'
import VueI18n from 'vue-i18n'
import 'muse-ui/dist/muse-ui.css'

Vue.use(VueI18n)
Vue.use(MuseUI)

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /.stories.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
