<template>
  <div style="display: flex">
    <div class="current-selection">
      <mu-paper :z-depth="1">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <img class="selected" v-if="currentSelection" :src="`iof-2004/${currentSelection}.svg`" />
          <h2>{{currentlySelectedSymbol && currentlySelectedSymbol.names.sv}}</h2>
        </div>
      </mu-paper>
    </div>
    <div class="list-container">
      <mu-paper :z-depth=1 style="    padding: 1em;">
        <mu-text-field v-model="search" placeholder="Sök"></mu-text-field><br/>
        <div class="list-scroller">
          <mu-list :value="currentSelection">
            <mu-list-item v-for="symbol in filteredSymbols" avatar button :key="symbol.id" :value="symbol.id" @click="selectSymbol(symbol.id)">
              <mu-list-item-action>
                <mu-avatar>
                  <img :src="`iof-2004/${symbol.id}.svg`" />
                </mu-avatar>
              </mu-list-item-action>
              <mu-list-item-title>{{symbol.names.sv}}</mu-list-item-title>
            </mu-list-item>
          </mu-list>
        </div>
      </mu-paper>
    </div>
  </div>    
</template>

<script>
export default {
  name: 'symbol-chooser',
  props: {
    symbols: Array,
    kind: String,
    selected: String
  },
  data () {
    return {
      currentSelection: null,
      search: ''
    }
  },
  methods: {
    selectSymbol (id) {
      this.currentSelection = id
      this.$emit('symbolselected', { id })
    }
  },
  computed: {
    filteredSymbols () {
      return this.symbols.filter(s =>
        s.id &&
        s.kind === this.kind &&
        (!this.search || s.names.sv && s.names.sv.toLowerCase().indexOf(this.search.toLowerCase()) >= 0))
    },
    currentlySelectedSymbol () {
      return this.symbols.find(s => s.id === this.currentSelection)
    }
  },
  watch: {
    selected (s) {
      this.currentSelection = s
    }    
  }
}
</script>

<style scoped>
  .selected {
    width: 10em;
    height: 10em;
  }

  .current-selection {
    width: 15em;
    height: 12em;
    margin: 1em;
  }

  .list-container {
    margin: 1em;
  }

  .list-scroller {
    max-height: 35em;
    overflow-x: auto;
  }
</style>
