/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import VueI18n from 'vue-i18n'

import parsePPen from '../src/parse-ppen'
import ppenXml from './static/example1.ppen'

import MyButton from './MyButton';
import Welcome from './Welcome';
import Sidebar from '../src/components/Sidebar.vue'

import messages from '../src/i18n'
const i18n = new VueI18n({
  locale: 'sv',
  messages
})

storiesOf('Welcome', module).add('to Storybook', () => ({
  components: { Welcome },
  template: '<welcome :showApp="action" />',
  methods: { action: linkTo('Button') },
}));

storiesOf('Sidebar', module).add('test', () => {
  const doc = new DOMParser().parseFromString(ppenXml, 'application/xml')
  const event = parsePPen(doc)
  const map = {
    name: 'Test'
  }

  return {
    components: { Sidebar },
    template: '<sidebar :event="event" :map="map" :selected-control="selectedControl" />',
    data () {
      return {
        event,
        map,
        selectedControl: 1
      }
    },
    i18n
  }
})

storiesOf('Button', module)
  .add('with text', () => ({
    components: { MyButton },
    template: '<my-button @click="action">Hello Button</my-button>',
    methods: { action: action('clicked') },
  }))
  .add('with JSX', () => ({
    components: { MyButton },
    // eslint-disable-next-line no-unused-vars
    render(h) {
      return <my-button onClick={this.action}>With JSX</my-button>;
    },
    methods: { action: linkTo('clicked') },
  }))
  .add('with some emoji', () => ({
    components: { MyButton },
    template: '<my-button @click="action">😀 😎 👍 💯</my-button>',
    methods: { action: action('clicked') },
  }));

/* eslint-enable react/react-in-jsx-scope */
