/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import VueI18n from 'vue-i18n'

import parsePPen from '../src/parse-ppen'
import parseSymbols from '../src/parse-symbols'
import ppenXml from './static/example1.ppen'
import symbolsXml from '../src/assets/symbols.xml'

import MyButton from './MyButton';
import Welcome from './Welcome';
import Sidebar from '../src/components/Sidebar.vue'
import SymbolChooser from '../src/components/SymbolChooser.vue'

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

storiesOf('SymbolChooser', module)
  .add('bare', () => {
    const doc = new DOMParser().parseFromString(symbolsXml, 'application/xml')
    const symbols = parseSymbols(doc)

    return {
      components: { SymbolChooser },
      template: '<symbol-chooser :symbols="symbols" kind="D" />',
      data () {
        return {
          symbols
        }
      },
      i18n
    }
  })
  .add('dialog', () => {
    const doc = new DOMParser().parseFromString(symbolsXml, 'application/xml')
    const symbols = parseSymbols(doc)

    return {
      components: { SymbolChooser },
      template: `
        <mu-container>
          <mu-button @click="openDialog()">Open</mu-button>
          <div>Current selection: {{selection || 'none'}}</div>
          <mu-dialog title="Select Symbol" width="600" max-width="80%" :esc-press-close="false" :overlay-close="false" :open.sync="dialogOpen">
            <symbol-chooser :symbols="symbols" kind="D" @symbolselected="dialogSelection = $event.id" />
            <mu-button slot="actions" flat @click="closeDialog">Cancel</mu-button>
            <mu-button slot="actions" flat color="primary" @click="dialogOk()">Ok</mu-button>
          </mu-dialog>
        </mu-container>`,
      data () {
        return {
          symbols,
          dialogOpen: false,
          dialogSelection: null,
          selection: null
        }
      },
      methods: {
        openDialog () {
          this.dialogOpen = true;
        },
        closeDialog () {
          this.dialogOpen = false;
        },
        dialogOk () {
          this.dialogOpen = false;
          this.selection = this.dialogSelection
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
