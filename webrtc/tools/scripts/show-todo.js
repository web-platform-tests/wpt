'use strict'

const path = require('path')
const yaml = require('js-yaml')

const { loadDir } = require('../lib/load')
const { filterReports } = require('../lib/filter')

async function main () {
  const dirPath = path.resolve(__dirname, '../../coverage')
  const report = await loadDir(dirPath)
  const filtered = filterReports(report,
    step => (step.status === 'todo'))

  console.log(yaml.safeDump(filtered))
}

main()
