// Electron API wrapper
export const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
}

export const getPlatform = () => {
  if (isElectron() && window.electronAPI.platform) {
    return window.electronAPI.platform
  }
  return 'web'
}

export const isWindows = () => getPlatform() === 'win32'
export const isMacOS = () => getPlatform() === 'darwin'
export const isLinux = () => getPlatform() === 'linux'

// Window control helpers (for future use with custom titlebar)
export const minimizeWindow = () => {
  // Will be implemented when custom titlebar is added
  console.log('minimize')
}

export const maximizeWindow = () => {
  console.log('maximize')
}

export const closeWindow = () => {
  console.log('close')
}
