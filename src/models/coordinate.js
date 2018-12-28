export default class Coordinate extends Array {
  vLength () {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1])
  }

  add (c1) {
    return new Coordinate(this[0] + c1[0], this[1] + c1[1])
  }

  sub (c1) {
    return new Coordinate(this[0] - c1[0], this[1] - c1[1])
  }
}