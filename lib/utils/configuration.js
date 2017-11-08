import path from 'path'
import glob from 'glob'

const DEFAULT_TIMEOUT = 10000
const NOOP = function() {}

class Configuration {
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

  constructor(request) {
    this._config = request
  }

  /**
   * Retuns array of tasks (test runner details)
   * {
   *   spec:file,
   *   capability: {
   *     browser:chrome,
   *   }
   * }
   */
  getJobs() {
    return Configuration.getFilePaths(this._config.specs)
      .map(file => {
        return {
          specs: [file]
        }
      })
  }

  getCapabilities() {

  }
}

export default Configuration

