export default (() => ({
  set (path, value) {
    localStorage.setItem(path, value)
  },

  get (path) {
    return localStorage.getItem(path)
  }
}))()
