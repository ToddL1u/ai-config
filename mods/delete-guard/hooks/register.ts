import type { Register } from 'claude-code'

import { findBulkDelete } from './detect'

export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    const reason = findBulkDelete(e.command)
    if (reason === null) return next(e)

    return {
      deny:
        `${$.plugin.name}: bulk deletion is blocked (${reason}). ` +
        'Delete one explicitly named file per rm call, or ask the user to delete these manually.',
    }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: its guard failed.` }))
}
