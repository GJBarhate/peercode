'use strict';

const Contest = require('../../models/Contest');
const Problem = require('../../models/Problem');
const logger = require('../../utils/logger');

// India does not observe DST, so "8:00 PM IST" / "9:30 PM IST" map to a
// fixed UTC offset (IST = UTC+5:30) without any calendar-day shift.
const CONTEST_START_UTC_HOUR = 14;
const CONTEST_START_UTC_MIN = 30; // 14:30 UTC == 20:00 IST
const CONTEST_END_UTC_HOUR = 16;
const CONTEST_END_UTC_MIN = 0; // 16:00 UTC == 21:30 IST

const UPCOMING_SLOTS_TO_MAINTAIN = 4;
const RECENT_CONTESTS_TO_AVOID_REPEATS = 3;

function isContestDay(utcDate) {
  const day = utcDate.getUTCDay();
  return day === 0 || day === 3; // Sunday or Wednesday
}

function slotSlugFor(utcDate) {
  return `contest-${utcDate.toISOString().slice(0, 10)}`;
}

function slotTitleFor(utcDate) {
  const dayName = utcDate.getUTCDay() === 0 ? 'Sunday' : 'Wednesday';
  const dateLabel = utcDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${dayName} Contest — ${dateLabel}`;
}

function getUpcomingContestDates(count, fromDate = new Date()) {
  const dates = [];
  const cursor = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  let guard = 0;
  while (dates.length < count && guard < 60) {
    if (isContestDay(cursor)) {
      const startTime = new Date(Date.UTC(
        cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(),
        CONTEST_START_UTC_HOUR, CONTEST_START_UTC_MIN
      ));
      if (startTime > fromDate) {
        dates.push(new Date(cursor));
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }
  return dates;
}

async function pickContestProblems(excludeIds) {
  const sampleByDifficulty = async (difficulty, size) => {
    const docs = await Problem.aggregate([
      { $match: { isActive: true, difficulty, _id: { $nin: excludeIds } } },
      { $sample: { size } },
    ]);
    return docs.map(d => d._id);
  };

  let easy = await sampleByDifficulty('easy', 1);
  let medium = await sampleByDifficulty('medium', 2);
  let hard = await sampleByDifficulty('hard', 1);

  let chosen = [...easy, ...medium, ...hard];

  // Backfill from any difficulty if a bucket came up short (small problem bank).
  if (chosen.length < 4) {
    const stillExclude = [...excludeIds, ...chosen];
    const fallback = await Problem.aggregate([
      { $match: { isActive: true, _id: { $nin: stillExclude } } },
      { $sample: { size: 4 - chosen.length } },
    ]);
    chosen = [...chosen, ...fallback.map(d => d._id)];
  }

  return chosen;
}

async function ensureUpcomingContestsExist() {
  const slots = getUpcomingContestDates(UPCOMING_SLOTS_TO_MAINTAIN);
  let created = 0;

  for (const slotDate of slots) {
    const slug = slotSlugFor(slotDate);
    const exists = await Contest.findOne({ slug }).select('_id');
    if (exists) continue;

    const recentContests = await Contest.find({})
      .sort({ startTime: -1 })
      .limit(RECENT_CONTESTS_TO_AVOID_REPEATS)
      .select('problems');
    const recentlyUsedIds = recentContests.flatMap(c => c.problems);

    const problems = await pickContestProblems(recentlyUsedIds);
    if (problems.length < 4) {
      logger.warn(`Skipping contest creation for ${slug}: not enough active problems in the bank (found ${problems.length}/4)`);
      continue;
    }

    const startTime = new Date(Date.UTC(
      slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(),
      CONTEST_START_UTC_HOUR, CONTEST_START_UTC_MIN
    ));
    const endTime = new Date(Date.UTC(
      slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(),
      CONTEST_END_UTC_HOUR, CONTEST_END_UTC_MIN
    ));

    await Contest.create({
      title: slotTitleFor(slotDate),
      slug,
      dayOfWeek: slotDate.getUTCDay() === 0 ? 'sunday' : 'wednesday',
      problems,
      startTime,
      endTime,
      status: 'upcoming',
    });
    created += 1;
  }

  return created;
}

function computeFinalRanks(contest) {
  const ranked = [...contest.participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aLast = a.solvedProblems.length ? Math.max(...a.solvedProblems.map(s => s.timeTakenSec || 0)) : Infinity;
    const bLast = b.solvedProblems.length ? Math.max(...b.solvedProblems.map(s => s.timeTakenSec || 0)) : Infinity;
    return aLast - bLast; // faster total time wins ties
  });
  ranked.forEach((p, i) => { p.finalRank = i + 1; });
}

async function transitionContestStatuses() {
  const now = new Date();
  let activated = 0;
  let completed = 0;

  const toActivate = await Contest.find({ status: 'upcoming', startTime: { $lte: now } });
  for (const contest of toActivate) {
    contest.status = 'active';
    await contest.save();
    activated += 1;
  }

  const toComplete = await Contest.find({ status: 'active', endTime: { $lte: now } });
  for (const contest of toComplete) {
    computeFinalRanks(contest);
    contest.status = 'completed';
    await contest.save();
    completed += 1;
  }

  return { activated, completed };
}

async function runContestLifecycleTick() {
  const created = await ensureUpcomingContestsExist();
  const { activated, completed } = await transitionContestStatuses();
  if (created || activated || completed) {
    logger.info(`Contest lifecycle tick: created=${created}, activated=${activated}, completed=${completed}`);
  }
  return { created, activated, completed };
}

module.exports = function defineContestSchedulerJob(agenda) {
  agenda.define('contest-lifecycle-tick', async () => {
    try {
      await runContestLifecycleTick();
    } catch (err) {
      logger.error('Contest lifecycle tick error:', err.message);
    }
  });
};

module.exports.runContestLifecycleTick = runContestLifecycleTick;
module.exports.getUpcomingContestDates = getUpcomingContestDates;
module.exports.computeFinalRanks = computeFinalRanks;
