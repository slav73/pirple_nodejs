var vm = require('vm')

var context = {
  foo: 25,
}

var script = new vm.Script(`
  foo = foo * 2
  var bar = foo + 1
  var fizz = 42
`)

script.runInNewContext(context)
console.log(context)
