export default class Event {
  constructor (name, courses) {
    this.name = name
    this.courses = courses || []
    this.controlCodeGenerator = (() => {
      let nextCode = 30
      return {
        next: () => nextCode++
      }
    })()
  }

  addCourse (course) {
    this.courses.push(course)
  }
}
