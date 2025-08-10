// Simple errno polyfill for browser environment
// The tmp module expects errno to have an 'errno' property

// Simple errno constants
const errno = {
  ENOENT: -2,
  EACCES: -13,
  EEXIST: -17,
  ENOTDIR: -20,
  EISDIR: -21,
  EINVAL: -22,
  EMFILE: -24,
  ENOSPC: -28,
  EPERM: -1,
  EIO: -5,
  ENXIO: -6,
  E2BIG: -7,
  ENOEXEC: -8,
  EBADF: -9,
  ECHILD: -10,
  EAGAIN: -11,
  ENOMEM: -12,
  EFAULT: -14,
  EBUSY: -16,
  EXDEV: -18,
  ENODEV: -19
};

// Export exactly what tmp module expects
module.exports = {
  errno: errno,
  code: {},
  ...errno
};
