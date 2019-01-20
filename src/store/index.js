import Vue from 'vue'
import Vuex from 'vuex'
import VuexUndoRedo from 'vuex-undo-redo'
import { MOVE_CONTROL, REMOVE_CONTROL, SELECT_CONTROL, SET_CONTROL_DESCRIPTION, SET_CONTROL_KIND, SET_MAP, ADD_EVENT_CONTROL, ADD_COURSE_CONTROL } from './mutation-types'
import Event from '../models/event'
import Course from '../models/course'
import i18n from '../i18n'

Vue.use(Vuex)
Vue.use(VuexUndoRedo, {
  ignoreMutations: [SELECT_CONTROL]
})

const debug = process.env.NODE_ENV !== 'production'

const createInitialState = () => {
  const event = new Event(i18n.t('event.newName'))
  const course = new Course(event, 1, i18n.t('course.newName'), [], 10000)
  event.addCourse(course)

  return {
    event,
    selectedCourseIndex: 0,
    selectedControlId: 0
  }
}

export default new Vuex.Store({
  strict: debug,
  state: createInitialState(),
  mutations: {
    emptyState () {
      this.replaceState(createInitialState())
    },
    [SET_MAP] (state, { name, scale }) {
      state.event.map = { name, scale }
    },
    [ADD_EVENT_CONTROL] (state, { id, kind, coordinates }) {
      state.event.addControl({
        id,
        kind,
        coordinates
      })
    },
    [ADD_COURSE_CONTROL] (state, { id }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.addControl(id)
    },
    [MOVE_CONTROL] (state, { id, coordinates }) {
      state.event.moveControl({id: id, coordinates})
    },
    [REMOVE_CONTROL] (state, { id }) {
      const course = state.event.courses[state.selectedCourseIndex]
      course.removeControl(id)      
    },
    [SELECT_CONTROL] (state, { id }) {
      state.selectedControlId = id
    },
    [SET_CONTROL_DESCRIPTION] (state, { id, kind, descriptionId }) {
      state.event.setControlDescription(id, kind, descriptionId)
    },
    [SET_CONTROL_KIND] (state, { id, kind }) {
      state.event.controls[id].kind = kind
    }
  },
  getters: {
    selectedCourse (state) {
      return state.event.courses[state.selectedCourseIndex]
    }
  }
})
