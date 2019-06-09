import Vue from 'vue'
import Vuex from 'vuex'
import Undo from '../undo-plugin'
import { MOVE_CONTROL, REMOVE_CONTROL, SELECT_CONTROL, SET_CONTROL_DESCRIPTION, SET_CONTROL_KIND, SET_MAP, ADD_EVENT_CONTROL, ADD_COURSE_CONTROL, ADD_COURSE, SET_SELECTED_COURSE, SET_EVENT_NAME, SET_COURSE_NAME, SET_EVENT, DELETE_CONTROL, SET_PRINT_SCALE, CHECKPOINT, SET_MAP_SCALE } from './mutation-types'
import Event from '../models/event'
import Course from '../models/course'
import i18n from '../i18n'

Vue.use(Vuex)
Vue.use(Undo, {
  ignoreMutations: [SELECT_CONTROL]
})

const debug = process.env.NODE_ENV !== 'production'

const createInitialState = () => {
  const event = new Event(i18n.t('event.newName'))
  const course = new Course(event, event.idGenerator.next(), i18n.t('course.newName'), [], 10000)
  event.addCourse(course)

  return {
    event,
    selectedCourseIndex: 0,
    selectedControlId: 0,
    checkpointId: 1
  }
}

export default new Vuex.Store({
  strict: debug,
  state: createInitialState(),
  mutations: {
    emptyState () {
      this.replaceState(createInitialState())
    },
    [SET_EVENT_NAME] (state, { name }) {
      state.event.name = name
    },
    [SET_COURSE_NAME] (state, { id, name }) {
      state.event.courses.find(c => c.id === id).name = name
    },
    [SET_MAP_SCALE] (state, { id, scale }) {
      state.event.courses.find(c => c.id === id).mapScale = scale
    },
    [SET_PRINT_SCALE] (state, { id, scale }) {
      state.event.courses.find(c => c.id === id).printScale = scale
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
    [DELETE_CONTROL] (state, { id }) {
      state.event.deleteControl(id)      
    },
    [SELECT_CONTROL] (state, { id }) {
      state.selectedControlId = id
    },
    [SET_CONTROL_DESCRIPTION] (state, { id, kind, descriptionId }) {
      state.event.setControlDescription(id, kind, descriptionId)
    },
    [SET_CONTROL_KIND] (state, { id, kind }) {
      state.event.controls[id].kind = kind
    },
    [ADD_COURSE] (state) {
      const newName = i18n.t('course.newName')
      const n = state.event.courses.filter(c => c.name.startsWith(newName)).length
      const startId = Object.keys(state.event.controls).find(id => state.event.controls[id].kind === 'start')
      const controls = startId ? [state.event.controls[startId]] : []
      const id = state.event.idGenerator.next()
      state.event.addCourse(new Course(state.event, id, `${newName} ${n +1}`, controls, 10000))
      state.selectedCourseIndex = state.event.courses.findIndex(c => c.id === id)
    },
    [SET_SELECTED_COURSE] (state, { id }) {
      state.selectedCourseIndex = state.event.courses.findIndex(c => c.id === id)
    },
    [SET_EVENT] (state, event) {
      state.event = event
      state.selectedCourseIndex = 0
      state.selectedControlId = undefined
    },
    [CHECKPOINT] (state) {
      state.checkpointId++
    }
  },
  getters: {
    selectedCourse (state) {
      return state.event.courses[state.selectedCourseIndex]
    }
  }
})
