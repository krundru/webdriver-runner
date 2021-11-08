const path = require('path')
const glob = require('glob')
const shortid = require('shortid')
const log = require('debug')('webdriver-runner:base')
const toKey = (br) => `${br.name}:${br.os || 'os'}`

class Configuration {
  /**
   * Initialize a configuration for given request.
   * @param  {Object} request test request
   * @return {Configuration}    new configuration instance
   */
  static of(request) {
    const config = new Configuration()
    config.init(request)
    return config
  }

  /**
   * Returns a flatten list of globed files
   *
   * @param  {String[]} filenames  list of files to glob
   * @return {String[]} list of files
   */
  static getFilePaths(patterns) {
    let files = []

    if (typeof patterns === 'string') {
      patterns = [patterns]
    }

    if (!Array.isArray(patterns)) {
      throw new Error('specs should be an array of strings')
    }

    for (let pattern of patterns) {
      let filenames = glob.sync(pattern)

      filenames = filenames.map(f => {
        return path.isAbsolute(f) ? path.normalize(f) : path.resolve(process.cwd(), f)
      })

      if (filenames.length === 0) {
        console.warn('pattern', pattern, 'did not match any file')
      }

      files = files.concat(filenames)
    }

    return files
  }

  /**
   * specs: [{
   *   files: ....,
   *   browsers: [{},{}]
   * }]
   *
   * @param  {[type]} request [description]
   * @return {[type]}         [description]
   */
  init(request) {
    this.request = request

    const jobs = []
    for (const spec of request.specs) {
      const files = Configuration.getFilePaths(spec.tests)
      log('Spec request:', spec)

      files.forEach(f => log('Resolved file: ', f))
      for (const file of files) {
        const browsers = spec.browsers || []
        if (browsers.length) {
          for (const browser of browsers) {
            jobs.push(this._createJob(spec, file, browser))
          }
        } else {
          jobs.push(this._createJob(spec, file, {}))
        }
      }
    }

    log('No of jobs created', jobs.length)
    jobs.forEach(j => log('Job details: ',  j.specId, j.name, j.browser.name, j.specs[0]))

    const groupMap = jobs.reduce((map, job) => {
      if (!map[job.group]) {
        map[job.group] = Object.assign({shard: 1, group: job.group}, job.browser)
      } else {
        map[job.group].shard = Math.max(map[job.group].shard, job.browser.shard || 1)
      }
      return map
    }, {})

    this.groups = Object.keys(groupMap).map(key => groupMap[key])
    this.groups.forEach(g => log('Group created: ', JSON.stringify(g)))
    this.jobs = jobs
  }

  _createJob(spec, file, browser) {
    return Object.assign({}, spec,{
      specs: [file],
      browser: browser,
      mochaOptions: this.request.mochaOptions || {},
      group: toKey(browser),
      specId: shortid.generate(),
      tests: undefined,
      browsers: undefined
    })
  }

  getArgv() {
    return this.request.execArgv || []
  }

  getReporters() {
    return this.request.reporters || []
  }

  getReporterOptions() {
    return this.request.reporterOptions || {}
  }

  getJobs() {
    return this.jobs
  }

  getBrowserGroups() {
    return this.groups
  }

  getMaxShards() {
    return this.request.maxShards
  }
}

module.exports = Configuration
