export function computeLineDiff(oldText, newText) {
 const oldLines = oldText.split('\n')
 const newLines = newText.split('\n')
 const result = []
 const oldSet = new Set(oldLines)
 const newSet = new Set(newLines)
 let oldIdx = 0
 let newIdx = 0
 while (oldIdx < oldLines.length || newIdx < newLines.length) {
 const oldLine = oldLines[oldIdx]
 const newLine = newLines[newIdx]
 if (oldIdx >= oldLines.length) {
 result.push({ type: 'added', line: newLine })
 newIdx++
 } else if (newIdx >= newLines.length) {
 result.push({ type: 'removed', line: oldLine })
 oldIdx++
 } else if (oldLine === newLine) {
 result.push({ type: 'unchanged', line: oldLine })
 oldIdx++
 newIdx++
 } else if (!newSet.has(oldLine)) {
 result.push({ type: 'removed', line: oldLine })
 oldIdx++
 } else if (!oldSet.has(newLine)) {
 result.push({ type: 'added', line: newLine })
 newIdx++
 } else {
 result.push({ type: 'removed', line: oldLine })
 result.push({ type: 'added', line: newLine })
 oldIdx++
 newIdx++
 }
 }
 return result
}

export function diffStats(oldText, newText) {
 const diff = computeLineDiff(oldText, newText)
 const added = diff.filter(d => d.type === 'added').length
 const removed = diff.filter(d => d.type === 'removed').length
 return { added, removed, delta: added - removed }
}

export function isApproachRestart(oldText, newText) {
 if (!oldText || oldText.trim().length === 0) return false
 const oldLines = oldText.split('\n').filter(l => l.trim().length > 0)
 if (oldLines.length < 5) return false
 const newSet = new Set(newText.split('\n'))
 const retained = oldLines.filter(l => newSet.has(l)).length
 return retained / oldLines.length < 0.2
}
