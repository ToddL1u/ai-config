type Word = { text: string; isQuoted: boolean }

const GLOB = /[*?[{]/

/**
 * Split a shell command into simple commands of words. Quotes group words;
 * unquoted ; & | newlines, $( and backticks end a command. Best effort, not a
 * shell parser: enough to see what each rm, find, xargs or git clean is handed.
 */
export function splitCommands(command: string): Word[][] {
  const commands: Word[][] = []
  let words: Word[] = []
  let text = ''
  let isQuoted = false
  let hasWord = false

  const endWord = () => {
    if (hasWord) words.push({ text, isQuoted })
    text = ''
    isQuoted = false
    hasWord = false
  }
  const endCommand = () => {
    endWord()
    if (words.length > 0) commands.push(words)
    words = []
  }

  for (let i = 0; i < command.length; i++) {
    const c = command[i]!
    if (c === "'" || c === '"') {
      const close = command.indexOf(c, i + 1)
      const end = close === -1 ? command.length : close
      text += command.slice(i + 1, end)
      isQuoted = true
      hasWord = true
      i = end
    } else if (c === '\\' && i + 1 < command.length) {
      text += command[++i]
      hasWord = true
    } else if (c === ' ' || c === '\t') {
      endWord()
    } else if (';&|\n`()'.includes(c) || (c === '$' && command[i + 1] === '(')) {
      endCommand()
    } else {
      text += c
      hasWord = true
    }
  }
  endCommand()

  return commands
}

const baseName = (word: string) => word.slice(word.lastIndexOf('/') + 1)

/** Drop leading `VAR=value`, `sudo`, `command`, `nohup`, `time`. */
function stripPrefix(words: Word[]): Word[] {
  let i = 0
  while (i < words.length) {
    const t = words[i]!.text
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || ['sudo', 'command', 'nohup', 'time', 'env'].includes(t)) i++
    else break
  }

  return words.slice(i)
}

function checkRm(args: Word[]): string | null {
  const paths: Word[] = []
  let isAfterDashes = false
  for (const w of args) {
    if (!isAfterDashes && w.text === '--') isAfterDashes = true
    else if (!isAfterDashes && !w.isQuoted && w.text.startsWith('-') && w.text.length > 1) {
      if (w.text === '--recursive' || (!w.text.startsWith('--') && /[rR]/.test(w.text))) return 'rm -r'
    } else paths.push(w)
  }
  if (paths.some(p => !p.isQuoted && GLOB.test(p.text))) return 'a glob in rm'
  if (paths.length > 1) return `rm with ${paths.length} paths`

  return null
}

function checkCommand(raw: Word[]): string | null {
  const words = stripPrefix(raw)
  if (words.length === 0) return null
  const name = baseName(words[0]!.text)
  const args = words.slice(1)
  const texts = args.map(w => w.text)

  if (name === 'rm') return checkRm(args)
  if (name === 'rmdir') {
    if (texts.some(t => t === '-p' || t === '--parents' || /^-[a-z]*p/.test(t))) return 'rmdir -p'
    if (texts.filter(t => !t.startsWith('-')).length > 1) return 'rmdir with several paths'
  }
  if (name === 'find') {
    if (texts.includes('-delete')) return 'find -delete'
    const exec = texts.findIndex(t => t === '-exec' || t === '-execdir' || t === '-ok')
    if (exec !== -1 && ['rm', 'rmdir', 'unlink'].includes(baseName(texts[exec + 1] ?? ''))) return 'find -exec rm'
  }
  if (name === 'xargs' && texts.some(t => ['rm', 'rmdir', 'unlink'].includes(baseName(t)))) return 'xargs rm'
  if (name === 'git' && texts[0] === 'clean' && !texts.some(t => t === '-n' || t === '--dry-run' || /^-[a-z]*n/.test(t))) {
    return 'git clean'
  }

  return null
}

/** The first bulk deletion in `command`, named; null when there is none. */
export function findBulkDelete(command: string): string | null {
  for (const words of splitCommands(command)) {
    const reason = checkCommand(words)
    if (reason !== null) return reason
  }

  return null
}
