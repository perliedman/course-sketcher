import { CHECKPOINT } from "./store/mutation-types";

const EMPTY_STATE = 'emptyState';

export default {
  install(Vue, options = {}) {
    if (!Vue._installedPlugins.find(plugin => plugin.Store)) {
      throw new Error("VuexUndoRedo plugin must be installed after the Vuex plugin.")
    }
    Vue.mixin({
      data() {
        return {
          done: [],
          undone: [],
          newMutation: true,
          ignoreMutations: options.ignoreMutations || []
        };
      },
      created() {
        if (this.$store) {
          this.$store.subscribe(mutation => {
            if (mutation.type !== EMPTY_STATE && this.ignoreMutations.indexOf(mutation.type) === -1) {
              this.done.push(mutation);
            }
            if (this.newMutation && mutation.type !== CHECKPOINT) {
              this.undone = [];
            }
          });
        }
      },
      computed: {
        canRedo() {
          return this.undone.length;
        },
        canUndo() {
          return this.done.length;
        }
      },
      methods: {
        redo() {
          let commits = []
          
          let popped = this.undone.pop()
          for (let count = 1; popped && (count <= 1 || popped.type !== CHECKPOINT); count++) {
            commits.push(popped);
            popped = this.undone.pop()
          }

          this.newMutation = false;
          commits.forEach(commit => {
            switch (typeof commit.payload) {
              case 'object':
                this.$store.commit(`${commit.type}`, Object.assign({}, commit.payload));
                break;
              default:
                this.$store.commit(`${commit.type}`, commit.payload);
            }
          })
          this.newMutation = true;
        },
        undo() {
          let popped = this.done.pop()
          for (let count = 1; popped && (count <= 1 || popped.type !== CHECKPOINT); count++) {
            this.undone.push(popped);
            popped = this.done.pop()
          }

          this.newMutation = false;
          this.$store.commit(EMPTY_STATE);
          this.done.forEach(mutation => {
            switch (typeof mutation.payload) {
              case 'object':
                this.$store.commit(`${mutation.type}`, Object.assign({}, mutation.payload));
                break;
              default:
                this.$store.commit(`${mutation.type}`, mutation.payload);
            }
            this.done.pop();
          });
          this.newMutation = true;
        }
      }
    });
  },
}
