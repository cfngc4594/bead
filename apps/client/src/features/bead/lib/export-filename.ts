export function uniqueNativeFileBase(filename: string, date = new Date()) {
  return `${stripFileExtension(filename)}-${formatNativeFileStamp(date)}`;
}

export function uniqueNativeFilename(filename: string, date = new Date()) {
  const base = stripFileExtension(filename);
  return `${base}-${formatNativeFileStamp(date)}${filename.slice(base.length)}`;
}

export function stripFileExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

function formatNativeFileStamp(date: Date) {
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}${pad(date.getMilliseconds(), 3)}`;
}
