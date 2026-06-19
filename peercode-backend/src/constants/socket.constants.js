'use strict';

module.exports = {
  EVENTS: {
    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',

    // Room
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',
    ROOM_UPDATED: 'room-updated',
    ROOM_ENDED: 'room-ended',
    ROOM_ERROR: 'room-error',
    PARTICIPANT_JOINED: 'participant-joined',
    PARTICIPANT_LEFT: 'participant-left',
    PARTICIPANT_REJOINED: 'participant-rejoined',
    PARTICIPANT_KICKED: 'participant-kicked',
    KICK_PARTICIPANT: 'kick-participant',

    // Session
    SESSION_ENDED: 'session-ended',
    END_SESSION: 'end_session',
    END_CALL: 'end-call',

    // Code
    CODE_CHANGE: 'code_change',
    CODE_UPDATED: 'code_updated',
    LANGUAGE_CHANGE: 'language_change',
    LANGUAGE_CHANGED: 'language_changed',
    CODE_SNAPSHOT: 'code-snapshot',
    YJS_UPDATE: 'yjs-update',
    YJS_REQUEST_STATE: 'yjs-request-state',
    YJS_STATE_REQUEST: 'yjs-state-request',
    YJS_STATE_RESPONSE: 'yjs-state-response',
    CURSOR_UPDATE: 'cursor-update',

    // Execution
    RUN_CODE: 'run-code',
    RUN_CODE_RESULT: 'run-code-result',
    CODE_EXECUTION_START: 'code_execution_start',
    CODE_EXECUTION_RESULT: 'code_execution_result',
    PARTNER_RUNNING_CODE: 'partner_running_code',
    EXECUTION_RESULT: 'execution_result',

    // Problem
    PROBLEM_SELECTED: 'problem-selected',
    PROBLEM_UPDATED: 'problem-updated',
    SET_PROBLEM: 'set_problem',

    // Chat
    CHAT_MESSAGE: 'chat-message',
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    GET_CHAT_HISTORY: 'get-chat-history',
    CHAT_HISTORY: 'chat-history',

    // Timer
    START_TIMER: 'start_timer',
    PAUSE_TIMER: 'pause_timer',
    RESUME_TIMER: 'resume_timer',
    TIMER_STARTED: 'timer_started',
    TIMER_PAUSED: 'timer_paused',
    TIMER_RESUMED: 'timer_resumed',
    TIMER_ADVANCED: 'timer_advanced',
    TIMER_ENDED: 'timer_ended',

    // WebRTC
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE_CANDIDATE: 'ice-candidate',
    USER_MIC_STATUS: 'user-mic-status',
    SCREEN_SHARE_STARTED: 'screen-share-started',
    SCREEN_SHARE_STOPPED: 'screen-share-stopped',

    // Queue
    QUEUE_JOIN: 'queue-join',
    QUEUE_LEAVE: 'queue-leave',
    QUEUE_MATCHED: 'queue-matched',
    QUEUE_WAITING: 'queue-waiting',
    QUEUE_TIMEOUT: 'queue-timeout',
    QUEUE_ERROR: 'queue-error',
    QUEUE_LEFT: 'queue-left',

    // Badges
    BADGE_EARNED: 'badge:earned',

    // Rejoin
    REJOIN_ROOM: 'rejoin-room',
    REJOINED: 'rejoined',
    REJOIN_ERROR: 'rejoin-error',
  },
};
