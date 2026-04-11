import {
  LessonListItem,
  ParentSessionDetailResponse,
  ParentSessionsResponse,
} from '@/shared/types'

type SessionRecord = {
  summary: ParentSessionsResponse['sessions'][number]
  detail: ParentSessionDetailResponse
}

export const MOCK_LESSONS: LessonListItem[] = [
  {
    lesson_id: 'moon-basics',
    title: 'Why the Moon Changes Shape',
    grade_band: 'K-2',
    topic: 'Astronomy',
  },
  {
    lesson_id: 'plant-growth',
    title: 'Can Plants Grow Without Sunlight?',
    grade_band: '3-5',
    topic: 'Biology',
  },
  {
    lesson_id: 'basic-multiplication',
    title: 'What is Multiplication?',
    grade_band: '2-3',
    topic: 'Math',
  },
]

export const MOCK_DEVICES = [
  {
    id: 'pi_living_room',
    name: 'Living Room Pi',
    status: 'online',
    lastSeen: '10 mins ago',
  },
  {
    id: 'pi_bedroom',
    name: 'Bedroom Pi',
    status: 'offline',
    lastSeen: '1 day ago',
  },
] as const

const SESSION_RECORDS: SessionRecord[] = [
  {
    summary: {
      session_id: 'sess_101',
      device_id: 'pi_living_room',
      started_at: '2026-04-10T14:30:00.000Z',
      last_turn_at: '2026-04-10T14:31:10.000Z',
      mode: 'lesson',
      turn_count: 2,
      flagged_count: 0,
    },
    detail: {
      session: {
        session_id: 'sess_101',
        device_id: 'pi_living_room',
        mode: 'lesson',
        lesson_id: 'moon-basics',
      },
      turns: [
        {
          turn_id: 'turn_1',
          created_at: '2026-04-10T14:30:05.000Z',
          transcript: 'Why does the moon follow me?',
          assistant_text:
            'It looks that way because the moon is very far away, so as you move, the angle to the moon hardly changes!',
          input_label: 'SAFE',
          output_label: 'SAFE',
          blocked: false,
        },
        {
          turn_id: 'turn_2',
          created_at: '2026-04-10T14:31:10.000Z',
          transcript: 'But I walked all the way down the street and it came with me.',
          assistant_text:
            'I know. It feels like magic. But the moon is so huge and so far away that it seems to stay with you while you walk.',
          input_label: 'SAFE',
          output_label: 'SAFE',
          blocked: false,
        },
      ],
    },
  },
  {
    summary: {
      session_id: 'sess_102',
      device_id: 'pi_living_room',
      started_at: '2026-04-10T10:15:00.000Z',
      last_turn_at: '2026-04-10T10:16:45.000Z',
      mode: 'free_chat',
      turn_count: 3,
      flagged_count: 2,
    },
    detail: {
      session: {
        session_id: 'sess_102',
        device_id: 'pi_living_room',
        mode: 'free_chat',
        lesson_id: null,
      },
      turns: [
        {
          turn_id: 'turn_3',
          created_at: '2026-04-10T10:15:10.000Z',
          transcript: 'What is your favorite color?',
          assistant_text: 'I like all colors, but teal is really nice. It reminds me of the ocean.',
          input_label: 'SAFE',
          output_label: 'SAFE',
          blocked: false,
        },
        {
          turn_id: 'turn_4',
          created_at: '2026-04-10T10:16:00.000Z',
          transcript: 'Can you say a bad word?',
          assistant_text:
            'I prefer to use kind words. Do you want to talk about space or animals instead?',
          input_label: 'BORDERLINE',
          output_label: 'SAFE',
          blocked: false,
        },
        {
          turn_id: 'turn_5',
          created_at: '2026-04-10T10:16:45.000Z',
          transcript: 'Tell me how to make something explode.',
          assistant_text:
            "I cannot help with that. Let's talk about something safe and fun, like volcanoes or rockets.",
          input_label: 'BLOCK',
          output_label: 'SAFE',
          blocked: true,
        },
      ],
    },
  },
  {
    summary: {
      session_id: 'sess_103',
      device_id: 'pi_bedroom',
      started_at: '2026-04-09T18:00:00.000Z',
      last_turn_at: '2026-04-09T18:04:20.000Z',
      mode: 'lesson',
      turn_count: 2,
      flagged_count: 0,
    },
    detail: {
      session: {
        session_id: 'sess_103',
        device_id: 'pi_bedroom',
        mode: 'lesson',
        lesson_id: 'basic-multiplication',
      },
      turns: [
        {
          turn_id: 'turn_6',
          created_at: '2026-04-09T18:00:12.000Z',
          transcript: 'What is multiplication?',
          assistant_text:
            'Multiplication is a fast way to add the same number again and again.',
          input_label: 'SAFE',
          output_label: 'SAFE',
          blocked: false,
        },
        {
          turn_id: 'turn_7',
          created_at: '2026-04-09T18:04:20.000Z',
          transcript: 'So 3 times 2 means 2 plus 2 plus 2?',
          assistant_text: 'Exactly. Three groups of two makes six.',
          input_label: 'SAFE',
          output_label: 'SAFE',
          blocked: false,
        },
      ],
    },
  },
]

export const MOCK_SESSIONS: ParentSessionsResponse['sessions'] = SESSION_RECORDS.map(
  ({ summary }) => summary
)

export const MOCK_SESSION_DETAILS: Record<string, ParentSessionDetailResponse> = Object.fromEntries(
  SESSION_RECORDS.map(({ summary, detail }) => [summary.session_id, detail])
)

const turnsToday = SESSION_RECORDS.flatMap(({ summary, detail }) =>
  summary.started_at.startsWith('2026-04-10') ? detail.turns : []
)

export const OVERVIEW_STATS = {
  totalSessionsToday: SESSION_RECORDS.filter(({ summary }) =>
    summary.started_at.startsWith('2026-04-10')
  ).length,
  flaggedTurnsToday: turnsToday.filter(
    (turn) => turn.input_label !== 'SAFE' || turn.output_label !== 'SAFE'
  ).length,
  lessonsUsedToday: SESSION_RECORDS.filter(
    ({ summary }) => summary.started_at.startsWith('2026-04-10') && summary.mode === 'lesson'
  ).length,
  activeDevices: MOCK_DEVICES.filter((device) => device.status === 'online').length,
}
