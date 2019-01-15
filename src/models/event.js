export default class Event {
  constructor (name, courses) {
    this.name = name
    this.courses = courses || []
    this.controlCodeGenerator = {
      next: sequence(30)
    }
    this.idGenerator = {
      next: sequence(1)
    }
  }

  addCourse (course) {
    this.courses.push(course)
  }
}

const sequence = start => (() => {
  let next = start
  return () => next++
})()