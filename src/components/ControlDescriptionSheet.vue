<template>
  <div>
    <div style="display: flex; justify-content: space-between;">
      <div>{{$t('course.printScale')}}</div>
      <div>1:<input type="number" v-model.number="printScale" style="width: 4em; text-align: right; border: none" step="500"/></div>
    </div>
    <table>
      <tbody>
        <tr class="heavy-bottom">
          <td colspan="8">
            <input type="text" v-model="eventName" />
          </td>
          <td class="control-menu"></td>
        </tr>
        <tr class="heavy-bottom">
          <td colspan="3" class="heavy-right">
            <input style="width: 6em" type="text" v-model="courseName" />
          </td>
          <td colspan="3" class="heavy-right">{{course.distance().toFixed(1)}} km</td>
          <td colspan="2"></td>
          <td class="control-menu"></td>
        </tr>
        <tr v-for="(c, i) in course.controls" :key="i" :class="{'light-bottom': i % 3 !== 0, 'heavy-bottom': i % 3 === 0, selected: c.id === selectedControlId}">
          <td>
            {{i > 0 ? i : ''}}
            <img v-if="i === 0" src="iof-2004/start.svg" />
          </td>
          <td>
            <input type="text" v-model="c.code" style="width: 2em" />
          </td>
          <td @click="openDialog(c.id, 'C', c.description.C)" class="heavy-right"><img v-if="c.description.C" :src="`iof-2004/${c.description.C}.svg`" /></td>
          <td @click="openDialog(c.id, 'D', c.description.D)" ><img v-if="c.description.D" :src="`iof-2004/${c.description.D}.svg`" /></td>
          <td @click="openDialog(c.id, 'E', c.description.E)" ><img v-if="c.description.E" :src="`iof-2004/${c.description.E}.svg`" /></td>
          <td @click="openDialog(c.id, 'F', c.description.F)"  class="heavy-right"><img v-if="c.description.F" :src="`iof-2004/${c.description.F}.svg`" /></td>
          <td @click="openDialog(c.id, 'G', c.description.G)" ><img v-if="c.description.G" :src="`iof-2004/${c.description.G}.svg`" /></td>
          <td @click="openDialog(c.id, 'H', c.description.H)" ><img v-if="c.description.H" :src="`iof-2004/${c.description.H}.svg`" /></td>
          <td class="control-menu">
            <mu-menu cover placement="bottom-end" :open="activeMenu == i">
              <mu-button icon small @click="activeMenu = i">
                <mu-icon value="more_vert"/>
              </mu-button>
              <mu-list slot="content">
                <mu-list-item v-if="i > 0 && i === course.controls.length - 1" button @click="menuAction('controlkindset', { id: c.id, kind: 'finish' })">
                  <mu-list-item-action><img src="finish-symbol.svg" style="width: 24px"/></mu-list-item-action>
                  <mu-list-item-title>{{$t('actions.makeFinish')}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item button @click="menuAction('controlremoved', { id: c.id })">
                  <mu-list-item-action><mu-icon value="remove"/></mu-list-item-action>
                  <mu-list-item-title>{{$t('actions.removeFromCourse')}}</mu-list-item-title>
                </mu-list-item>
                <mu-list-item button @click="menuAction('controldeleted', { id: c.id })">
                  <mu-list-item-action><mu-icon value="delete"/></mu-list-item-action>
                  <mu-list-item-title>{{$t('actions.deleteControl')}}</mu-list-item-title>
                </mu-list-item>
              </mu-list>
            </mu-menu>
          </td>
        </tr>
      </tbody>
    </table>
    <mu-dialog :title="$t('control.selectDescription')" width="600" max-width="80%" :open.sync="dialogOpen">
      <symbol-chooser :symbols="symbols" :kind="dialogKind" :selected="dialogSelection" @symbolselected="dialogResult = $event.id" />
      <mu-button slot="actions" flat @click="closeDialog">{{$t('actions.cancel')}}</mu-button>
      <mu-button slot="actions" flat color="primary" @click="dialogOk()">{{$t('actions.ok')}}</mu-button>
    </mu-dialog>
  </div>
</template>

<script>
import symbolsXml from '../assets/symbols.xml'
import parseSymbols from '../parse-symbols.js'
import SymbolChooser from './SymbolChooser.vue'

const symbols = parseSymbols(new DOMParser().parseFromString(symbolsXml, 'application/xml'))

export default {
  name: 'ControlDescriptionSheet',
  components: { SymbolChooser },
  props: {
    event: Object,
    course: Object,
    selectedControlId: Number
  },
  data () {
    return {
      dialogOpen: false,
      dialogControlId: null,
      dialogKind: null,
      dialogSelection: null,
      dialogResult: null,
      activeMenu: null,
      symbols
    }
  },
  computed: {
    eventName: {
      get () { return this.event.name },
      set (v) { this.$emit('eventnameset', { name: v })}
    },
    courseName: {
      get () { return this.course.name },
      set (v) { this.$emit('coursenameset', { name: v })}
    },
    printScale: {
      get () { return this.course.printScale },
      set (v) { this.$emit('printscaleset', { scale: v })}
    }
  },
  methods: {
    openDialog (controlId, kind, selection) {
      this.dialogControlId = controlId
      this.dialogKind = kind
      this.dialogSelection = selection
      this.dialogOpen = true
    },
    closeDialog () {
      this.dialogOpen = false
    },
    dialogOk () {
      this.dialogOpen = false
      this.$emit('controldescriptionset', {
        controlId: this.dialogControlId,
        kind: this.dialogKind,
        descriptionId: this.dialogResult
       })
    },
    menuAction (eventName, eventProps) {
      this.$emit(eventName, eventProps)
      this.activeMenu = null
    }
  }
}
</script>

<style scoped>
  table {
    border-collapse: collapse;
  }

  tr:first-child td {
    border-top: 2px solid black;
  }

  tr:last-child td {
    border-bottom: 2px solid black;
  }

  td:first-child {
    border-left: 2px solid black;
  }

  td {
    text-align: center;
    color: black;
    min-width: 2.5em;
    padding: 0.2em;
    border-right: 1px solid black;
  }

  .selected {
    background-color: #eee;
  }

  td:hover {
    background-color: #ccc;
    cursor: pointer;
  }

  .light-bottom td {
    border-bottom: 1px solid black;
  }

  .heavy-bottom td {
    border-bottom: 2px solid black;
  }

  .heavy-right {
    border-right: 2px solid black;
  }

  .control-menu {
    background-color: white !important;
    border: none !important;
    border-left: 2px solid black !important;
  }

  input {
    text-align: center;
    border: none;
  }
</style>
