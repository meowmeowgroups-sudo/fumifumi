import { db } from './firebase'
import { doc, setDoc, getDocFromServer, onSnapshot, serverTimestamp } from 'firebase/firestore'

let currentUserId = null
let careDocRef = null

let getState = null
let onRemoteHandler = null
let onErrorHandler = null
let onStatusHandler = null
let unsubscribe = null
let lastAppliedUpdatedAtMs = 0
let lastPushedStateJson = ''
let lastPushAtMs = 0
let lastPullAtMs = 0
let lastError = ''
let migrationAttempted = false
let pushPaused = false
let remoteApplyPaused = false
let localAuthoritativeUntil = 0
let hasAppliedServerSnapshot = false

const getCareDoc = () => {
  if (!careDocRef) throw new Error('Care sync not initialized for user')
  return careDocRef
}

const stateJson = (state) => {
  try {
    return JSON.stringify(state ?? null)
  } catch {
    return ''
  }
}

const cloneCareState = (state) => JSON.parse(JSON.stringify(state ?? null))

const hasMeaningfulCareState = (state) => {
  if (!state || typeof state !== 'object') return false
  const completionCount = Object.keys(state.completions || {}).length
  return completionCount > 0
    || (state.customItems?.length ?? 0) > 0
    || (state.hiddenBuiltinIds?.length ?? 0) > 0
    || (state.trashedCustomItems?.length ?? 0) > 0
    || Object.keys(state.builtinOverrides || {}).length > 0
}

const reportStatus = (patch = {}) => {
  onStatusHandler?.({
    listenerActive: !!unsubscribe,
    lastAppliedUpdatedAtMs,
    lastPushAtMs,
    lastPullAtMs,
    lastError,
    localCompletions: Object.keys(getState?.()?.completions || {}).length,
    ...patch,
  })
}

const markPushedStateAfterApply = () => {
  const local = getState?.()
  if (local) {
    lastPushedStateJson = stateJson(cloneCareState(local))
  }
}

const shouldApplyRemoteCareState = (remoteState, updatedAtMs) => {
  if (remoteApplyPaused) return false
  if (Date.now() < localAuthoritativeUntil) return false
  const remoteJson = stateJson(cloneCareState(remoteState))
  const localJson = stateJson(cloneCareState(getState?.()))
  if (localJson && localJson === remoteJson) {
    if (updatedAtMs > 0) {
      lastAppliedUpdatedAtMs = Math.max(lastAppliedUpdatedAtMs, updatedAtMs)
    }
    lastPushedStateJson = localJson
    return false
  }
  return true
}

const applyRemoteCareSnapshot = (remoteState, updatedAtMs) => {
  if (remoteApplyPaused) return false
  if (!remoteState || !onRemoteHandler) return false
  if (!shouldApplyRemoteCareState(remoteState, updatedAtMs)) return false
  if (updatedAtMs > 0) lastAppliedUpdatedAtMs = updatedAtMs
  pushPaused = true
  try {
    onRemoteHandler(cloneCareState(remoteState))
    lastError = ''
    markPushedStateAfterApply()
    reportStatus({ lastApplyAtMs: Date.now() })
    return true
  } catch (err) {
    lastError = err?.message || String(err)
    reportStatus()
    return false
  } finally {
    pushPaused = false
  }
}

export const initCareSyncForUser = (userId) => {
  if (!userId) throw new Error('userId required')
  if (currentUserId === userId && careDocRef) return
  destroyCareSync()
  currentUserId = userId
  careDocRef = doc(db, 'users', userId, 'app', 'careMaintenance')
}

export const registerCareSync = ({ getState: getter, onRemote, onError, onStatus } = {}) => {
  getState = getter
  onRemoteHandler = onRemote
  onErrorHandler = onError
  onStatusHandler = onStatus
  reportStatus()
}

export const pauseCareSyncPush = (paused) => {
  pushPaused = !!paused
}

export const pauseCareRemoteApply = (paused) => {
  remoteApplyPaused = !!paused
}

export const pushCareSync = async ({ force = false } = {}) => {
  if (!force && pushPaused) return
  if (!getState || !careDocRef) return
  const state = cloneCareState(getState())
  if (!state) return
  const fp = stateJson(state)
  if (!force && fp === lastPushedStateJson) return
  try {
    await setDoc(getCareDoc(), {
      state,
      updatedAt: serverTimestamp(),
    })
    lastPushedStateJson = fp
    lastPushAtMs = Date.now()
    lastError = ''
    localAuthoritativeUntil = Date.now() + 4000
    reportStatus()
  } catch (err) {
    lastError = err?.message || String(err)
    console.error('Care checklist sync failed:', err)
    reportStatus()
    onErrorHandler?.(err)
    throw err
  }
}

export const resetCareSyncPushFingerprint = () => {
  lastPushedStateJson = ''
}

export const markCareSyncLocalAuthoritative = (ms = 4000) => {
  localAuthoritativeUntil = Date.now() + ms
}

export const pullCareSyncFromServer = async (force = false) => {
  if (!onRemoteHandler || !careDocRef) return { ok: false, reason: 'not-registered' }
  try {
    const snapshot = await getDocFromServer(getCareDoc())
    lastPullAtMs = Date.now()
    if (!snapshot.exists()) {
      reportStatus({ serverExists: false })
      return { ok: true, reason: 'empty-doc', applied: false }
    }
    hasAppliedServerSnapshot = true
    const data = snapshot.data()
    const applied = applyRemoteCareSnapshot(
      data.state,
      data.updatedAt?.toMillis?.() ?? 0
    )
    reportStatus({
      serverExists: true,
      serverCompletions: Object.keys(data.state?.completions || {}).length,
      serverUpdatedAtMs: data.updatedAt?.toMillis?.() ?? null,
    })
    return { ok: true, applied, reason: applied ? 'applied' : 'unchanged' }
  } catch (err) {
    lastError = err?.message || String(err)
    console.error('Care checklist pull failed:', err)
    reportStatus()
    onErrorHandler?.(err)
    return { ok: false, reason: lastError }
  }
}

export const diagnoseCareSync = async () => {
  const local = getState?.() ?? null
  let server = null
  let serverError = ''
  try {
    if (!careDocRef) throw new Error('Care sync not initialized')
    const snap = await getDocFromServer(getCareDoc())
    server = snap.exists() ? snap.data() : null
  } catch (err) {
    serverError = err?.message || String(err)
  }
  const localJson = stateJson(local)
  const serverJson = stateJson(server?.state ?? null)
  return {
    listenerActive: !!unsubscribe,
    projectId: 'fumifumi-8988',
    docPath: currentUserId ? `users/${currentUserId}/app/careMaintenance` : null,
    localCompletions: Object.keys(local?.completions || {}).length,
    serverExists: !!server,
    serverCompletions: Object.keys(server?.state?.completions || {}).length,
    serverUpdatedAtMs: server?.updatedAt?.toMillis?.() ?? null,
    lastAppliedUpdatedAtMs,
    lastPushAtMs,
    lastPullAtMs,
    lastError: lastError || serverError,
    statesMatch: localJson === serverJson,
    serverError,
  }
}

const migrateLegacyCareToCloud = async (legacyState) => {
  if (migrationAttempted || !hasMeaningfulCareState(legacyState) || !careDocRef) return
  migrationAttempted = true
  try {
    const state = cloneCareState(legacyState)
    lastPushedStateJson = stateJson(state)
    await setDoc(getCareDoc(), {
      state,
      updatedAt: serverTimestamp(),
    })
    lastPushAtMs = Date.now()
    reportStatus()
  } catch (err) {
    migrationAttempted = false
    lastError = err?.message || String(err)
    console.error('Care checklist migration failed:', err)
    onErrorHandler?.(err)
    reportStatus()
  }
}

export const subscribeCareSync = (legacyState = null) => {
  if (unsubscribe || !careDocRef) return
  unsubscribe = onSnapshot(
    getCareDoc(),
    (snapshot) => {
      if (snapshot.metadata.fromCache && hasAppliedServerSnapshot) return

      if (!snapshot.exists()) {
        if (!snapshot.metadata.fromCache) migrateLegacyCareToCloud(legacyState)
        return
      }

      if (!snapshot.metadata.fromCache) hasAppliedServerSnapshot = true

      const data = snapshot.data()
      applyRemoteCareSnapshot(data.state, data.updatedAt?.toMillis?.() ?? 0)
      reportStatus({
        serverExists: true,
        serverCompletions: Object.keys(data.state?.completions || {}).length,
        serverUpdatedAtMs: data.updatedAt?.toMillis?.() ?? 0,
      })
    },
    (err) => {
      lastError = err?.message || String(err)
      console.error('Care checklist listener error:', err)
      reportStatus()
      onErrorHandler?.(err)
    }
  )
  reportStatus({ listenerActive: true })
}

export const destroyCareSync = () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  hasAppliedServerSnapshot = false
  lastAppliedUpdatedAtMs = 0
  lastPushedStateJson = ''
  migrationAttempted = false
  currentUserId = null
  careDocRef = null
  reportStatus({ listenerActive: false })
}

export const getCareSyncStatus = () => ({
  listenerActive: !!unsubscribe,
  lastAppliedUpdatedAtMs,
  lastPushAtMs,
  lastPullAtMs,
  lastError,
  localCompletions: Object.keys(getState?.()?.completions || {}).length,
})
