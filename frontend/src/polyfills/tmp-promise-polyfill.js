// tmp-promise module polyfill for browser environment
// This provides Promise-based temporary file/directory operations for browsers

// Generate a random temporary name
function generateTmpName(prefix = 'tmp', suffix = '') {
  const randomString = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${randomString}${suffix}`;
}

// Promise-based tmp module replacement
const tmpPromise = {
  // Promise-based temporary file creation
  file: function(options = {}) {
    return Promise.resolve().then(() => {
      const name = generateTmpName(options.prefix, options.postfix);
      return {
        path: `/tmp/${name}`,
        fd: null, // File descriptor not applicable in browser
        cleanup: async function() {
          // No-op in browser environment
          console.log('tmp-promise file cleanup called (no-op in browser)');
        }
      };
    });
  },

  // Promise-based temporary directory creation
  dir: function(options = {}) {
    return Promise.resolve().then(() => {
      const name = generateTmpName(options.prefix, options.postfix);
      return {
        path: `/tmp/${name}`,
        cleanup: async function() {
          // No-op in browser environment
          console.log('tmp-promise dir cleanup called (no-op in browser)');
        }
      };
    });
  },

  // Promise-based temporary name generation
  tmpName: function(options = {}) {
    return Promise.resolve().then(() => {
      return `/tmp/${generateTmpName(options.prefix, options.postfix)}`;
    });
  },

  // Synchronous versions wrapped in promises for compatibility
  fileSync: function(options = {}) {
    const name = generateTmpName(options.prefix, options.postfix);
    return {
      name: `/tmp/${name}`,
      fd: null,
      removeCallback: function() {
        console.log('tmp-promise fileSync removeCallback called (no-op in browser)');
      }
    };
  },

  dirSync: function(options = {}) {
    const name = generateTmpName(options.prefix, options.postfix);
    return {
      name: `/tmp/${name}`,
      removeCallback: function() {
        console.log('tmp-promise dirSync removeCallback called (no-op in browser)');
      }
    };
  },

  tmpNameSync: function(options = {}) {
    return `/tmp/${generateTmpName(options.prefix, options.postfix)}`;
  },

  // Cleanup function (no-op in browser)
  setGracefulCleanup: function() {
    console.log('tmp-promise setGracefulCleanup called (no-op in browser)');
  }
};

module.exports = tmpPromise;
