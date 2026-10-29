const { spawnSync } = require('node:child_process')

const allowedLicenses = [
    'MIT',
    'MIT/X11',
    'BSD',
    '0BSD',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'BlueOak-1.0.0',
    'ISC',
    'Apache',
    'Apache-2.0',
    'WTFPL',
    'CC-BY-3.0',
    'CC-BY-4.0',
    'CC0-1.0',
    'GPL',
    'Python-2.0',
    'Unlicense',
    '(MIT OR GPL-2.0)',
]

const result = spawnSync(
    'yarn',
    [
        'licenses',
        'audit',
        '--recursive',
        '--production',
        '--json',
        '--exclude-metadata',
        ...allowedLicenses.flatMap((license) => ['--allowed', license]),
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
)

if (result.error) throw result.error
if (result.status !== 0 && result.status !== 1) process.exit(result.status || 1)
if (!result.stdout.trim()) process.exit(result.status)

let violations = 0
for (const line of result.stdout.trim().split('\n')) {
    const group = JSON.parse(line)
    // Preserve the existing package exception without allowing all UNKNOWN licenses.
    for (const [locator] of Object.entries(group.children)) {
        if (locator.startsWith('cycle@npm:')) continue
        console.error(`${group.value}: ${locator}`)
        violations++
    }
}
process.exitCode = violations > 0 ? 1 : 0
