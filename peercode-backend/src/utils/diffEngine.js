'use strict';

/**
 * Takes a snapshots array and returns diffs between consecutive snapshots.
 * Each diff: { index, timestamp, prevLines, currLines, additions, deletions, totalLines }
 */
function computeDiffs(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return [];

  return snapshots.map((snap, i) => {
    const currLines = snap.code ? snap.code.split('\n') : [];
    const prevLines = i === 0 ? [] : (snapshots[i - 1].code ? snapshots[i - 1].code.split('\n') : []);

    const prevSet = new Set(prevLines);
    const currSet = new Set(currLines);

    const additions = currLines.filter((line) => !prevSet.has(line)).length;
    const deletions = prevLines.filter((line) => !currSet.has(line)).length;

    return {
      index: i,
      timestamp: snap.timestamp,
      language: snap.language,
      userId: snap.userId,
      prevLines: prevLines.length,
      currLines: currLines.length,
      additions,
      deletions,
      totalLines: currLines.length,
    };
  });
}

module.exports = { computeDiffs };
