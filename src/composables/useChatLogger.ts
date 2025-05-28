import type { AppState, ChatHistoryItem, LogEntry, TimelineChunk } from '../types'

import { ref } from 'vue'

export function useChatLogger() {
  const logEntries = ref<LogEntry[]>([])
  const systemEvents = ref<LogEntry[]>([])
  const currentChunkIndex = ref<number | null>(null)
  const timelineChunks = ref<TimelineChunk[]>([])

  const logMessage = (message: ChatHistoryItem) => {
    logEntries.value.push({
      timestamp: Date.now(),
      type: 'message',
      content: message,
      metadata: {
        activeChunkIndex: currentChunkIndex.value !== null ? currentChunkIndex.value : undefined,
        dateRange:
          currentChunkIndex.value !== null
            ? {
                start: timelineChunks.value[currentChunkIndex.value].dateRange.start,
                end: timelineChunks.value[currentChunkIndex.value].dateRange.end
              }
            : undefined
      }
    })
  }

  const logContextSwitch = (newChunkIndex: number, chunk: TimelineChunk, appState: AppState) => {
    currentChunkIndex.value = newChunkIndex
    appState.timeline = chunk.content

    systemEvents.value.push({
      timestamp: Date.now(),
      type: 'context_switch',
      content: chunk,
      metadata: {
        activeChunkIndex: newChunkIndex,
        dateRange: chunk.dateRange,
        event: `Context switched to Epoch ${newChunkIndex + 1}: ${chunk.dateRange.start} to ${chunk.dateRange.end}`
      }
    })
  }

  const logSystemEvent = (
    event: string,
    metadata: Record<string, any> = {},
    appState: AppState
  ) => {
    systemEvents.value.push({
      timestamp: Date.now(),
      type: 'system_event',
      content: event,
      metadata: {
        event,
        ...metadata
      }
    })
    console.log(systemEvents)
  }

  const getMessageContext = (messageIndex: number): TimelineChunk | null => {
    const messageTimestamp = logEntries.value[messageIndex].timestamp
    const previousContextSwitch = [...systemEvents.value]
      .filter((entry) => entry.type === 'context_switch')
      .reverse()
      .find((entry) => entry.timestamp <= messageTimestamp)

    return previousContextSwitch ? (previousContextSwitch.content as TimelineChunk) : null
  }

  const setTimelineChunks = (chunks: TimelineChunk[], appState: AppState) => {
    timelineChunks.value = chunks
    if (chunks.length > 0) {
      logContextSwitch(0, chunks[0], appState)
    }
  }

  const getMergedTranscriptEvents = () => {
    return [...logEntries.value, ...systemEvents.value].sort((a, b) => a.timestamp - b.timestamp)
  }

  const generateAuditTrail = () => {
    return systemEvents.value.map((entry) => ({
      timestamp: new Date(entry.timestamp).toISOString(),
      type: entry.type,
      content:
        entry.type === 'context_switch'
          ? `Context switch to Epoch ${entry.metadata.activeChunkIndex !== undefined ? entry.metadata.activeChunkIndex + 1 : 'N/A'}: ${entry.metadata.dateRange?.start ?? 'N/A'} to ${entry.metadata.dateRange?.end ?? 'N/A'}`
          : entry.metadata.event,
      context: entry.metadata
    }))
  }

  const clearLog = () => {
    logEntries.value = []
    systemEvents.value = []
    currentChunkIndex.value = null
  }

  return {
    logMessage,
    logContextSwitch,
    logSystemEvent,
    getMessageContext,
    generateAuditTrail,
    getMergedTranscriptEvents,
    setTimelineChunks,
    clearLog,
    logEntries,
    systemEvents
  }
}
