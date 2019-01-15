import Vue from 'vue'
import Vuex from 'vuex'
import VuexUndoRedo from 'vuex-undo-redo'
import { ADD_CONTROL, MOVE_CONTROL, REMOVE_CONTROL, SELECT_CONTROL, SET_CONTROL_DESCRIPTION, SET_CONTROL_KIND } from './mutation-types'
import Event from '../models/event'
import Course from '../models/course'
import i18n from '../i18n'

Vue.use(Vuex)
Vue.use(VuexUndoRedo, {
  ignoreMutations: [SELECT_CONTROL]
})

const debug = process.env.NODE_ENV !== 'production'

const createInitialState = () => ({
  event: new Event(i18n.t('event.newName'), [
    new Course(1, i18n.t('course.newName'), [], 15000, 10000)
  ]),
  selectedCourseIndex: 0,
  selectedControlId: 0
})

export default new Vuex.Store({
  strict: debug,
  state: createInitialState(),
  mutations: {
    emptyState () {
      this.replaceState(createInitialState())
    },
    [ADD_CONTROL] (state, { coordinates }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.addControl({
        id: state.event.idGenerator.next(),
        code: course.controls.length > 0 ? state.event.controlCodeGenerator.next() : null,
        coordinates
      })
    },
    [MOVE_CONTROL] (state, { id, coordinates }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.moveControl({id: id, coordinates})
    },
    [REMOVE_CONTROL] (state, { id }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.removeControl(id)      
    },
    [SELECT_CONTROL] (state, { id }) {
      state.selectedControlId = id
    },
    [SET_CONTROL_DESCRIPTION] (state, { id, kind, descriptionId }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.setControlDescription(id, kind, descriptionId)
    },
    [SET_CONTROL_KIND] (state, { id, kind }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.controls.find(c => c.id === id).kind = kind
    }
  },
  getters: {
    selectedCourse (state) {
      return state.event.courses[state.selectedCourseIndex]
    }
  }
})
