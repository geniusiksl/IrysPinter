// Constants polyfill for fs module constants

// File system constants that are commonly used
const constants = {
  // File access constants
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,

  // File open constants
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_CREAT: 64,
  O_EXCL: 128,
  O_NOCTTY: 256,
  O_TRUNC: 512,
  O_APPEND: 1024,
  O_DIRECTORY: 65536,
  O_NOATIME: 262144,
  O_NOFOLLOW: 131072,
  O_SYNC: 1052672,
  O_DSYNC: 4096,
  O_DIRECT: 16384,
  O_NONBLOCK: 2048,

  // File type constants
  S_IFMT: 61440,
  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFCHR: 8192,
  S_IFBLK: 24576,
  S_IFIFO: 4096,
  S_IFLNK: 40960,
  S_IFSOCK: 49152,

  // File mode constants
  S_IRWXU: 448,
  S_IRUSR: 256,
  S_IWUSR: 128,
  S_IXUSR: 64,
  S_IRWXG: 56,
  S_IRGRP: 32,
  S_IWGRP: 16,
  S_IXGRP: 8,
  S_IRWXO: 7,
  S_IROTH: 4,
  S_IWOTH: 2,
  S_IXOTH: 1,

  // Additional constants
  UV_FS_SYMLINK_DIR: 1,
  UV_FS_SYMLINK_JUNCTION: 2,
  UV_FS_COPYFILE_EXCL: 1,
  UV_FS_COPYFILE_FICLONE: 2,
  UV_FS_COPYFILE_FICLONE_FORCE: 4,

  COPYFILE_EXCL: 1,
  COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE_FORCE: 4,

  // Error number constants
  errno: {
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
  }
};

module.exports = constants;