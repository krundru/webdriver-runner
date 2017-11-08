const Launcher = require('./build/launcher').Launcher

new Launcher({
  specs: ['specs/*.test.js'],
  capabilities: [{
    browserName: 'chrome',
    maxInstances: 2
  }]
}).run()
