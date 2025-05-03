import { convertJSONtoMarkdown, processTimeline, validateFile } from '../utils'

import type { AppState } from '../types'
import { useTranscript } from '../composables/useTranscript'

const showAuth = (appState: AppState, writeMessage: (message: string, type: string) => void) => {
  appState.isAuthorized = true
  writeMessage('Authorized', 'success')
}

const showJWT = async (
  jwt: string,
  writeMessage: (message: string, type: string) => void,
  appState: AppState,
  closeSession: () => void,
  showPopup: () => void
) => {
  if (!appState.uri) {
    // writeMessage('No URI found in Querystring or LocalStorage', 'error')
    return
  }

  appState.jwt = jwt
  writeMessage('Loading Patient Timeline...', 'success')
  appState.isLoading = true

  try {
    // Initial request to start the process
    const processResponse = await fetch(appState.uri, {
      headers: {
        Authorization: `Bearer ${appState.jwt}`
      }
    })

    let processID = await processResponse.json()
    const pollingUri = appState.uri + '?process=' + processID.process

    // Modified polling function that checks response status first
    const pollForData = async (maxAttempts = 30, interval = 2000): Promise<string> => {
      let attempts = 0

      while (attempts < maxAttempts) {
        try {
          // Use a HEAD request first to check status without triggering a 404 error
          const checkResponse = await fetch(pollingUri, {
            method: 'HEAD',
            headers: {
              Authorization: `Bearer ${appState.jwt}`
            }
          })

          if (checkResponse.ok) {
            // If HEAD request succeeds, make the actual GET request
            const response = await fetch(pollingUri, {
              headers: {
                Authorization: `Bearer ${appState.jwt}`
              }
            })
            return await response.text()
          }

          // If we get here, the resource isn't ready yet
          await new Promise((resolve) => setTimeout(resolve, interval))
          attempts++

          if (attempts % 5 === 0) {
            writeMessage(`Still waiting for data... (${attempts}/${maxAttempts})`, 'info')
          }
        } catch (error) {
          // If HEAD request isn't supported, fall back to original behavior
          console.warn('HEAD request not supported, falling back to GET')
          const response = await fetch(pollingUri, {
            headers: {
              Authorization: `Bearer ${appState.jwt}`
            }
          })

          if (response.ok) {
            return await response.text()
          }
        }
      }

      throw new Error('Timeout waiting for data')
    }

    // Rest of the function remains the same
    const data = await pollForData()
    const { timeline, hasError } = processTimeline(data, writeMessage)

    if (hasError) {
      appState.popupContent = 'Timeline size is too large. You may want to edit it manually.'
      appState.popupContentFunction = closeSession
      showPopup()
      return
    }

    if (Array.isArray(timeline)) {
      appState.timelineChunks = timeline
      appState.hasChunkedTimeline = true
      appState.timeline = timeline[0].content

      appState.chatHistory = [
        {
          role: 'system',
          content: `Timeline context (${timeline[0].dateRange.start} to ${timeline[0].dateRange.end}):\n\n${timeline[0].content}`
        }
      ]
    } else {
      appState.timeline = timeline
      appState.hasChunkedTimeline = false
      appState.timelineChunks = []

      appState.chatHistory = [
        {
          role: 'system',
          content: `Timeline context:\n\n${timeline}`
        }
      ]
    }

    appState.isLoading = false
    writeMessage('Patient Timeline Loaded', 'success')
  } catch (error: any) {
    writeMessage(`Error: ${error.message}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const uploadFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  const validation = await validateFile(file, writeMessage)

  if (!validation.isValid || !validation.processedContent) {
    writeMessage(validation.error || 'Invalid file', 'error')
    return
  }

  appState.isLoading = true
  try {
    if (Array.isArray(validation.processedContent)) {
      // Simply set the chunks and current content in memory
      appState.timelineChunks = validation.processedContent
      appState.hasChunkedTimeline = true

      const firstChunk = validation.processedContent[0]
      appState.timeline = firstChunk.content

      // Set the single system message with the current chunk
      appState.chatHistory = [
        {
          role: 'system',
          content: `Timeline context (${firstChunk.dateRange.start} to ${firstChunk.dateRange.end}):\n\n${firstChunk.content}`
        }
      ]
    } else {
      appState.timeline = validation.processedContent
      appState.hasChunkedTimeline = false
      appState.timelineChunks = []

      appState.chatHistory = [
        {
          role: 'system',
          content: `Timeline context:\n\n${validation.processedContent}`
        }
      ]
    }

    writeMessage('Timeline processed successfully', 'success')
  } catch (error: any) {
    writeMessage(`Error: ${error.message}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const saveToNosh = async (
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  showPopup: () => void,
  closeSession: () => void
) => {
  const { generateTranscript } = useTranscript()
  appState.isLoading = true
  writeMessage('Saving to Nosh...', 'success')

  try {
    const transcriptContent = generateTranscript(appState) // Generate transcript with system events

    const response = await fetch(appState.writeuri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.jwt}`
      },
      body: JSON.stringify({
        content: transcriptContent
      })
    })

    await response.json()
    writeMessage('Saved to Nosh', 'success')
    appState.isLoading = false
    appState.popupContent = 'Session saved to Nosh. Close this window to end the session.'
    appState.popupContentFunction = closeSession
    showPopup()
  } catch (error) {
    writeMessage('Failed to save to Nosh', 'error')
    appState.isLoading = false
  }
}

export { showAuth, showJWT, saveToNosh, uploadFile }
