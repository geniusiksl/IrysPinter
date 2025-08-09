// Stream promises polyfill for browser environment
const { Readable, Writable, Transform, PassThrough } = require('stream-browserify');
const { promisify } = require('util');

// Create promise-based versions of stream methods
const pipeline = (...streams) => {
  return new Promise((resolve, reject) => {
    let lastStream = streams[0];
    
    for (let i = 1; i < streams.length; i++) {
      const currentStream = streams[i];
      lastStream = lastStream.pipe(currentStream);
    }
    
    lastStream.on('finish', resolve);
    lastStream.on('error', reject);
  });
};

const finished = (stream) => {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

module.exports = {
  pipeline,
  finished,
  Readable,
  Writable,
  Transform,
  PassThrough
};