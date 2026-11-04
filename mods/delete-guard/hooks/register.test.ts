import { expect, test } from 'claude-code/testing'

const BLOCKED = [
  'rm -rf node_modules',
  'rm -fr dist',
  'rm -R build',
  'rm --recursive tmp',
  'rm *.log',
  'rm a.txt b.txt',
  'cd src && rm -rf old',
  'sudo rm -r /tmp/x',
  '/bin/rm -rf x',
  'find . -name "*.tmp" -delete',
  'find . -name x -exec rm {} \;',
  'ls | xargs rm',
  'git clean -fd',
  'rmdir -p a/b/c',
  'echo $(rm -rf x)',
]

const ALLOWED = [
  'rm "/path/to/file.txt"',
  'rm -f /tmp/one.txt',
  'rm "/path/with space/My File.txt"',
  'rm "file*.txt"',
  'rmdir empty-dir',
  'git clean -n',
  'git status && ls -la',
  'echo "rm -rf is dangerous"',
  'npm run build 2>&1 | tail -5',
]

for (const command of BLOCKED) {
  test(`blocks: ${command}`, async ($, on) => {
    on('tool.call', () => ({ result: {} }))
    const ran = await $.tool.call({ tool: 'Bash', command })
    expect(ran.deny).toMatch(/bulk deletion is blocked/)
  })
}

for (const command of ALLOWED) {
  test(`allows: ${command}`, async ($, on) => {
    on('tool.call', () => ({ result: {} }))
    const ran = await $.tool.call({ tool: 'Bash', command })
    expect(ran.deny).toBeUndefined()
  })
}
