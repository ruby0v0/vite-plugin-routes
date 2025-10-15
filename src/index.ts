import type { Plugin } from 'vite'
import type { UserOptions } from './types'
import { resolve } from 'node:path'
import process from 'node:process'

function routesPlugin(opts: UserOptions = {}): Plugin {
  const { dir = '/src/pages' } = opts
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'vite-plugin-routes',
    resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
      return null
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId)
        return null

      const escapedDir = dir.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      const dirRegex = new RegExp(escapedDir, 'g')
      const code = `
        const modules = import.meta.glob('${dir}/**/*.vue', { eager: true })
        const routes = []
        for (const path in modules) {
          const normalizedPath = path
            .replace(${dirRegex}, '')
            .replace(/\\.vue$/, '')
            .replace(/\\/index$/, '')
            .replace(/\\/_/g, '/:') || '/'
          const routePath = normalizedPath[0] + normalizedPath[1].toLowerCase() + normalizedPath.slice(2)
          const name = routePath.split('/')[1]
          routes.push({
            name,
            path: name === 'index' ? '/' : routePath,
            component: () => import(/* @vite-ignore */ routePath),
          })
        }
        export default routes
        `

      return code
    },
    configureServer(server) {
      const absRoutes = resolve(process.cwd(), dir)
      server.watcher.add(absRoutes)

      const invalidate = () => {
        const mod = server.moduleGraph.getModuleById(virtualModuleId)
        if (mod)
          server.moduleGraph.invalidateModule(mod)
      }

      server.watcher.on('add', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}

export { type UserOptions }

export default routesPlugin
