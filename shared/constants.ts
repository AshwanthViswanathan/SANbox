export const TEACHBOX_DEVICE_TOKEN_ENV = 'DEVICE_INGEST_TOKEN'

export const COSMO_STATES = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'blocked',
  'error',
] as const

export const TEACHBOX_MODES = ['free_chat', 'lesson'] as const

export const SAFEGUARD_LABELS = ['SAFE', 'BORDERLINE', 'BLOCK'] as const
