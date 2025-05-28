import type { AppState, ChatHistory, TimelineChunk } from '../types'

import { useChatLogger } from './useChatLogger'

interface TranscriptSection {
  type: 'conversation' | 'context' | 'timeline' | 'audit' | 'session' | 'signature'
  content: string
}

const formatDate = (date: string | number | Date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function useTranscript() {
  const { systemEvents, generateAuditTrail, logSystemEvent } = useChatLogger()

  const generateSessionInfo = (appState: AppState): string => {
    return `### Session Information\n
- Date: ${formatDate(new Date())}
- User: ${appState.userName}
- Total Messages: ${appState.chatHistory.filter((msg) => msg.role !== 'system').length}`
  }

  const generateConversation = (chatHistory: ChatHistory): string => {
    return (
      `### Conversation\n\n` +
      chatHistory
        .map((msg) => {
          // Find the active context at the time this message was logged
          const contextSwitch = systemEvents.value
            .filter((event) => event.type === 'context_switch')
            .reverse()
            .find((event) => true) // Get the most recent context switch

          const contextInfo =
            contextSwitch && msg.role !== 'system' && contextSwitch.metadata.activeChunkIndex !== undefined
              ? ` [Context: Epoch ${contextSwitch.metadata.activeChunkIndex + 1}]`
              : ''
          console.log(msg)
          return msg.role !== 'system'
            ? `##### ${msg.role}${contextInfo}:\n${msg.content}`
            : `##### ${msg.role}${contextInfo}:\n${typeof msg.content === 'string' ? msg.content.split('\n')[0] : ''}`
        })
        .join('\n\n')
    )
  }

  const generateEpochs = (timelineChunks: TimelineChunk[]): string => {
    return (
      `### Epochs\n\n` +
      timelineChunks
        .map(
          (chunk) =>
            `#### Epoch ${chunk.epoch}\n` +
            `- Date Range: ${chunk.dateRange.start} to ${chunk.dateRange.end}\n` +
            `- Token Count: ${chunk.tokenCount.toLocaleString()}`
        )
        .join('\n\n')
    )
  }

  const generateTimeline = (timeline: string, timelineChunks: TimelineChunk[]): string => {
    if (timelineChunks.length === 0) {
      return `### Complete Timeline\n\n${timeline}`
    } else {
      return `### Complete Timeline\n\n${timelineChunks.map((chunk) => chunk.content).join('\n\n')}`
    }
  }

  const generateAuditSection = (): string => {
    const audit = generateAuditTrail()
    return (
      `### Audit Trail\n\n` +
      audit.map((entry) => `- ${formatDate(entry.timestamp)}: ${entry.content}`).join('\n')
    )
  }

  const generateSignature = (username: string): string => {
    return `### Signature\n\nSigned by: ${username}\nDate: ${new Date().toDateString()}`
  }

  const generateTranscript = (appState: AppState, includeSystem: boolean = false): string => {
    logSystemEvent(
      'Generating transcript',
      {
        includeSystem,
        messageCount: appState.chatHistory.length,
        hasChunkedTimeline: appState.hasChunkedTimeline
      },
      appState
    )

    const sections: TranscriptSection[] = [
      {
        type: 'session',
        content: generateSessionInfo(appState)
      },
      {
        type: 'conversation',
        content: generateConversation(appState.chatHistory)
      },
      {
        type: 'context',
        content: generateEpochs(appState.timelineChunks)
      },
      {
        type: 'audit',
        content: generateAuditSection()
      },
      {
        type: 'signature',
        content: generateSignature(appState.userName)
      }
    ]

    if (includeSystem) {
      sections.push({
        type: 'timeline',
        content: generateTimeline(appState.timeline, appState.timelineChunks)
      })
    }

    return sections.map((section) => section.content).join('\n\n') + '\n'
  }

  return {
    generateTranscript,
    generateTimeline
  }
}
