// File system polyfill for browser environment
const constants = require('./constants-polyfill');

// Mock fs functions that return appropriate errors or empty results
const fs = {
  constants,
  
  // Async functions with callbacks
  readFile: (path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    setTimeout(() => callback(new Error('ENOENT: no such file or directory')), 0);
  },
  
  writeFile: (path, data, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    setTimeout(() => callback(new Error('EACCES: permission denied')), 0);
  },
  
  access: (path, mode, callback) => {
    if (typeof mode === 'function') {
      callback = mode;
      mode = constants.F_OK;
    }
    setTimeout(() => callback(new Error('ENOENT: no such file or directory')), 0);
  },
  
  stat: (path, callback) => {
    setTimeout(() => callback(new Error('ENOENT: no such file or directory')), 0);
  },
  
  mkdir: (path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    setTimeout(() => callback(new Error('EACCES: permission denied')), 0);
  },
  
  rmdir: (path, callback) => {
    setTimeout(() => callback(new Error('ENOENT: no such file or directory')), 0);
  },
  
  unlink: (path, callback) => {
    setTimeout(() => callback(new Error('ENOENT: no such file or directory')), 0);
  },
  
  // Sync functions that throw errors
  readFileSync: (path, options) => {
    throw new Error('ENOENT: no such file or directory');
  },
  
  writeFileSync: (path, data, options) => {
    throw new Error('EACCES: permission denied');
  },
  
  accessSync: (path, mode) => {
    throw new Error('ENOENT: no such file or directory');
  },
  
  statSync: (path) => {
    throw new Error('ENOENT: no such file or directory');
  },
  
  mkdirSync: (path, options) => {
    throw new Error('EACCES: permission denied');
  },
  
  rmdirSync: (path) => {
    throw new Error('ENOENT: no such file or directory');
  },
  
  unlinkSync: (path) => {
    throw new Error('ENOENT: no such file or directory');
  },
  
  // Promise versions
  promises: {
    readFile: (path, options) => {
      return Promise.reject(new Error('ENOENT: no such file or directory'));
    },
    writeFile: (path, data, options) => {
      return Promise.reject(new Error('EACCES: permission denied'));
    },
    access: (path, mode) => {
      return Promise.reject(new Error('ENOENT: no such file or directory'));
    },
    stat: (path) => {
      return Promise.reject(new Error('ENOENT: no such file or directory'));
    },
    mkdir: (path, options) => {
      return Promise.reject(new Error('EACCES: permission denied'));
    },
    rmdir: (path) => {
      return Promise.reject(new Error('ENOENT: no such file or directory'));
    },
    unlink: (path) => {
      return Promise.reject(new Error('ENOENT: no such file or directory'));
    }
  }
};

module.exports = fs;