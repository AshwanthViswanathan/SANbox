import { MOCK_DEVICES } from '@/lib/mock-data'
import type {
  ParentDeviceControlRequest,
  ParentDeviceControlResponse,
  ParentDeviceControlState,
} from '@/shared/types'

const DEFAULT_CONTROLS: ParentDeviceControlState = {
  device: 'active',
  microphone: 'on',
  speaker: 'on',
}

const deviceControlStore = new Map<
  string,
  {
    controls: ParentDeviceControlState
    updatedAt: string
  }
>()

export function getDeviceControl(deviceId: string): ParentDeviceControlResponse {
  const existing = deviceControlStore.get(deviceId)

  if (existing) {
    return {
      device_id: deviceId,
      controls: existing.controls,
      updated_at: existing.updatedAt,
    }
  }

  const defaultControls = buildDefaultDeviceControl(deviceId)
  deviceControlStore.set(deviceId, {
    controls: defaultControls,
    updatedAt: new Date().toISOString(),
  })

  return getDeviceControl(deviceId)
}

export function setDeviceControl(
  deviceId: string,
  payload: ParentDeviceControlRequest
): ParentDeviceControlResponse {
  const updatedAt = new Date().toISOString()

  deviceControlStore.set(deviceId, {
    controls: payload.controls,
    updatedAt,
  })

  return {
    device_id: deviceId,
    controls: payload.controls,
    updated_at: updatedAt,
  }
}

function buildDefaultDeviceControl(deviceId: string): ParentDeviceControlState {
  const knownDevice = MOCK_DEVICES.find((device) => device.id === deviceId)
  if (!knownDevice) {
    return DEFAULT_CONTROLS
  }

  if (knownDevice.status === 'offline') {
    return {
      device: 'off',
      microphone: 'on',
      speaker: 'on',
    }
  }

  return DEFAULT_CONTROLS
}
