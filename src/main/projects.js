import path from 'path'
import url from 'url'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import settings from 'electron-settings'
import * as R from 'ramda'
import { existsSync } from 'fs'

// Facade for windows state =>

// TODO: define naming scheme for settings keys
// -> e.g. application preferences, session state (windows), etc.
const RECENT_PROJECTS = 'recentProjects'
const MAX_ENTRIES = 5

const State = {}
State.clear = () => settings.delete('global.windows')
State.allWindows = () => settings.get('global.windows', {})
State.deleteWindow = id => settings.delete(`global.windows.${id}`)
State.updateWindow = (id, props) => {
  const key = `global.windows.${id}`
  settings.set(key, { ...settings.get(key, {}), ...props })
}

// project handling =>

let shuttingDown = false

const sendMessage = window => (event, ...args) => {
  if (!window) return
  window.send(event, args)
}

const windowTitle = options => options.path ? path.basename(options.path) : 'ODIN - C2IS'

/**
 * Open project window.
 * @param {*} options window options
 */
export const createProject = (options = {}) => {
  const devServer = process.argv.indexOf('--noDevServer') === -1
  const hotDeployment = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
    /[\\/]electron[\\/]/.test(process.execPath)

  const windowUrl = (hotDeployment && devServer)
    ? url.format({ protocol: 'http:', host: 'localhost:8080', pathname: 'index.html', slashes: true })
    : url.format({ protocol: 'file:', pathname: path.join(app.getAppPath(), 'dist', 'index.html'), slashes: true })

  const window = new BrowserWindow({
    ...options,
    title: windowTitle(options),
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  const updateBounds = () => State.updateWindow(window.id, { ...window.getBounds() })
  const deleteWindow = () => {
    if (shuttingDown) return
    State.deleteWindow(window.id)
  }

  State.updateWindow(window.id, options)
  window.viewport = options.viewport
  window.path = options.path
  window.once('ready-to-show', () => window.show())
  window.once('close', deleteWindow)
  window.on('page-title-updated', event => event.preventDefault())
  window.on('move', updateBounds)
  window.on('resize', updateBounds)
  // TODO: support fullscreen

  window.loadURL(windowUrl)
  return window
}

/**
 * Open project path in window.
 * @param {*} window project window (optional)
 * @param {*} projectPath the path to a project (Optional. If given, the application will not open the chooseProjectPath dialog.)
 */
export const openProject = (window, projectPath) => {

  const open = ({ canceled, filePaths = [] }) => {
    if (canceled) return

    if (!filePaths.length) return
    const path = filePaths[0]

    if (!existsSync(path)) {
      return dialog.showErrorBox('Path does not exist', `The project path ${path} does not exist.`)
    }

    // Check if project is already open in another window:
    const candidate = Object
      .entries(State.allWindows())
      .find(([_, value]) => value.path === path)

    if (candidate) return BrowserWindow.fromId(Number.parseInt(candidate[0])).focus()

    if (!window) createProject({ path })
    else {
      State.updateWindow(window.id, { path })
      window.setTitle(windowTitle({ path }))
      sendMessage(window)('IPC_OPEN_PROJECT', path)
    }

    // Remember path in 'recent projects':
    // Add path to tail, make entries unique and cap to max size:
    const prepend = R.compose(R.slice(0, MAX_ENTRIES), R.uniq, R.prepend(path))
    const projects = settings.get(RECENT_PROJECTS, [])
    settings.set(RECENT_PROJECTS, prepend(projects))
  }

  if (projectPath) {
    open({ filePaths: [projectPath] })
  } else {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] })
      .then(open)
      .catch(/* TODO: handle */)
  }
}

export const clearRecentProjects = () => {
  settings.set(RECENT_PROJECTS, [])
}

// listeners =>

app.on('activate', () => createProject(/* empty project */))
app.on('before-quit', () => (shuttingDown = true))
app.on('ready', () => {

  // Since window ids are not stable between session,
  // we clear state now and recreate it with current ids.
  const state = Object.values(State.allWindows())
  State.clear()

  if (state.length) state.forEach(createProject)
  else createProject(/* empty project */)
})

ipcMain.on('IPC_VIEWPORT_CHANGED', (event, viewport) => {
  const { id } = event.sender.getOwnerBrowserWindow()
  State.updateWindow(id, { viewport })
})
