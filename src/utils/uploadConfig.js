export const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / 1024 / 1024
export const MAX_REQUEST_SIZE_BYTES = 157286400

export function formatUploadSizeError(fileName = '') {
  const prefix = fileName ? `File "${fileName}" ` : 'File '
  return `${prefix}exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB.`
}
