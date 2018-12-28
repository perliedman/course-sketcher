import Coordinate from './models/coordinate'
import Course from './models/course';

export default function parsePPen (crs, doc) {
  const controls = Array.prototype.slice.call(doc.getElementsByTagName('control'))
    .map(parseControl.bind(null, crs))
  const courseControls = Array.prototype.slice.call(doc.getElementsByTagName('course-control'))
    .reduce((a, cc) => {
      const id = cc.getAttribute('id')
      const control = cc.getAttribute('control')
      const nextTag = cc.getElementsByTagName('next')
      let next = undefined
      if (nextTag && nextTag[0]) {
        next = nextTag[0].getAttribute('course-control')
      }

      a[id] = {
        control,
        next
      }

      return a
    }, {})
  const getCourseControls = (id, sequence) => {
    const control = controls.find(c => c.id === courseControls[id].control)
    const next = courseControls[id].next
    // Clone the feature root and its properties
    const courseControl = {...control, properties: {...control.properties}}

    courseControl.properties.sequence = sequence > 0 && next ? sequence : undefined

    return [courseControl]
      .concat(next ? getCourseControls(next, sequence + 1) : [])
  }
  const courses = Array.prototype.slice.call(doc.getElementsByTagName('course'))
    .filter(c => c.getElementsByTagName('first').length > 0)
    .map(c => {
      const courseControls = getCourseControls(c.getElementsByTagName('first')[0].getAttribute('course-control'), 0)
      const course = new Course(c.getAttribute('id'), c.getElementsByTagName('name')[0].textContent, courseControls)
      course.order = Number(c.getAttribute('order'))

      return course
    })
    .sort((a, b) => a.order - b.order)

  return courses
}


const parseLocation = loc => new Coordinate(
  Number(loc.getAttribute('x')),
  Number(loc.getAttribute('y'))
)

const parseControl = (crs, tag) => {
  const codeTag = tag.getElementsByTagName('code')[0]
  return {
    type: 'Feature',
    id: tag.id,
    properties: {
      kind: tag.getAttribute('kind'),
      code: codeTag ? codeTag.textContent : undefined
    },
    geometry: {
      type: 'Point',
      coordinates: parseLocation(tag.getElementsByTagName('location')[0])
    }
  }
}
