'use strict'

const compareSection = (section1, section2) => {
  const sections1 = section1.split('.')
  const sections2 = section2.split('.')

  const length1 = sections1.length
  const length2 = sections2.length
  const maxLength = Math.max(length1, length2)

  for (let i = 0; i < maxLength; i++) {
    if (i > length1) return 1
    if (i > length2) return -1

    const v1 = parseInt(sections1[i])
    const v2 = parseInt(sections2[i])

    if (v1 > v2) return 1
    if (v2 > v1) return -1
  }

  return 0
}

const sortFilePaths = filePaths => {
  const sorted = [...filePaths]
  sorted.sort((path1, path2) => {
    const section1 = path1.split('_')[0]
    const section2 = path2.split('_')[0]
    return compareSection(section1, section2)
  })

  return sorted
}

module.exports = {
  compareSection,
  sortFilePaths
}
