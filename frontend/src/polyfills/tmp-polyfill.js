// tmp module polyfill for browser environment
// The tmp module is designed for Node.js file system operations
// This provides a browser-compatible alternative

// Generate a random temporary name
function generateTmpName(prefix = 'tmp', suffix = '') {
  const randomString = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${randomString}${suffix}`;
}

// Browser-compatible tmp module replacement
const tmp = {
  // Synchronous temporary file creation (returns path-like string)
  fileSync: function(options = {}) {
    const name = generateTmpName(options.prefix, options.postfix);
    return {
      name: `/tmp/${name}`,
      fd: null, // File descriptor not applicable in browser
      removeCallback: function() {
        // No-op in browser environment
        console.log('tmp.fileSync removeCallback called (no-op in browser)');
      }
    };
  },

  // Synchronous temporary directory creation
  dirSync: function(options = {}) {
    const name = generateTmpName(options.prefix, options.postfix);
    return {
      name: `/tmp/${name}`,
      removeCallback: function() {
        // No-op in browser environment
        console.log('tmp.dirSync removeCallback called (no-op in browser)');
      }
    };
  },

  // Asynchronous temporary file creation
  file: function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    setTimeout(() => {
      const result = tmp.fileSync(options);
      callback(null, result.name, result.fd, result.removeCallback);
    }, 0);
  },

  // Asynchronous temporary directory creation
  dir: function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    setTimeout(() => {
      const result = tmp.dirSync(options);
      callback(null, result.name, result.removeCallback);
    }, 0);
  },

  // Temporary name generation
  tmpName: function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    setTimeout(() => {
      const name = generateTmpName(options.prefix, options.postfix);
      callback(null, `/tmp/${name}`);
    }, 0);
  },

  tmpNameSync: function(options = {}) {
    return `/tmp/${generateTmpName(options.prefix, options.postfix)}`;
  },

  // Cleanup function (no-op in browser)
  setGracefulCleanup: function() {
    console.log('tmp.setGracefulCleanup called (no-op in browser)');
  }
};

module.exports = tmp;
