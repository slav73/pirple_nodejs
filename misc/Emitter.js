class Emitter {
  constructor() {
    this.listeners = {}
  }

  emit(event, ...args) {
    if (!Array.isArray(this.listeners[event])) {
      return false
    }

    this.listeners[event].forEach((listener) => listener(...args))
  }

  subscribe(event, fn) {
    this.listeners[event] = this.listeners[event] || []

    this.listeners[event].push(fn)

    return () => {
      this.listeners[event] = this.listeners[event].filter((l) => l !== fn)
    }
  }
}

const emitter = new Emitter()

const unsub = emitter.subscribe('test', (data) => console.log(data))
emitter.emit('test', 42)

setTimeout(() => {
  emitter.emit('test', 'after 2 sec')
}, 2000)

setTimeout(() => {
  unsub()
}, 3000)

setTimeout(() => {
  emitter.emit('test', 'after 4 sec')
}, 4000)
