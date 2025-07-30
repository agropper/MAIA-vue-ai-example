import type { AppState, ValidationResult, UploadedFile } from '../types'
import { convertJSONtoMarkdown, processTimeline, validateFile, estimateTokenCount, parseTranscriptFromMarkdown, extractTextFromPDF, detectFileType } from '../utils'
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

      const bytes = new TextEncoder().encode(timeline[0].content).length
      const tokens = estimateTokenCount(timeline[0].content)
      appState.chatHistory = [
        {
          role: 'system',
          content: `Timeline context (${timeline[0].dateRange.start} to ${timeline[0].dateRange.end}) [${bytes} bytes, ~${tokens} tokens]:\n\n${timeline[0].content}`
        }
      ]
    } else {
      appState.timeline = timeline
      appState.hasChunkedTimeline = false
      appState.timelineChunks = []

      const bytes = new TextEncoder().encode(timeline).length
      const tokens = estimateTokenCount(timeline)
      appState.chatHistory = [
        {
          role: 'system',
          content: `Timeline context: [${bytes} bytes, ~${tokens} tokens]\n\n${timeline}`
        }
      ]
    }

    appState.isLoading = false
    writeMessage('Patient Timeline Loaded', 'success')
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    writeMessage(`Error: ${errorMessage}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const uploadTranscriptFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true
  try {
    const content = await file.text()
    
    // Parse the transcript content to validate it's a proper transcript
    const chatHistory = parseTranscriptFromMarkdown(content)
    
    if (chatHistory.length === 0) {
      writeMessage('No conversation found in transcript file', 'error')
      return
    }
    
    // Add to uploaded files for badge display
    const uploadedFile: UploadedFile = {
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: 'transcript',
      content: content,
      uploadedAt: new Date()
    }
    appState.uploadedFiles.push(uploadedFile)
    
    // Don't add to chat history - just make available as context
    writeMessage(`Transcript loaded successfully with ${chatHistory.length} messages`, 'success')
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error loading transcript:', error)
    writeMessage(`Error: ${errorMessage}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const uploadPDFFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true
  try {
    // Check file size (limit to 50MB to prevent memory issues)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`)
    }

    // Use FormData for more efficient file upload
    const formData = new FormData()
    formData.append('pdfFile', file)
    
    // Send to server for PDF parsing
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to parse PDF')
    }

    const result = await response.json()
    
    const uploadedFile: UploadedFile = {
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: 'pdf',
      content: result.markdown,
      uploadedAt: new Date()
    }
    appState.uploadedFiles.push(uploadedFile)
    // Don't add to chat history - just make available as context
    writeMessage(`PDF file loaded successfully (${result.pages} pages, ${result.characters} characters)`, 'success')
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error loading PDF:', error)
    writeMessage(`Error: ${errorMessage}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const uploadMarkdownFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true
  try {
    const content = await file.text()
    const uploadedFile: UploadedFile = {
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: 'markdown',
      content: content,
      uploadedAt: new Date()
    }
    appState.uploadedFiles.push(uploadedFile)
    // Don't add to chat history - just make available as context
    writeMessage('Markdown file loaded successfully', 'success')
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error loading markdown:', error)
    writeMessage(`Error: ${errorMessage}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const uploadTimelineFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true
  try {
    const content = await file.text()
    const uploadedFile: UploadedFile = {
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: 'timeline',
      content: content,
      uploadedAt: new Date()
    }
    appState.uploadedFiles.push(uploadedFile)
    // Don't add to chat history - just make available as context
    writeMessage('Timeline file loaded successfully', 'success')
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error loading timeline:', error)
    writeMessage(`Error: ${errorMessage}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

const uploadTextFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true
  try {
    const content = await file.text()
    const uploadedFile: UploadedFile = {
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: 'text',
      content: content,
      uploadedAt: new Date()
    }
    appState.uploadedFiles.push(uploadedFile)
    // Don't add to chat history - just make available as context
    writeMessage('Text file loaded successfully', 'success')
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error('Error loading text file:', error)
    writeMessage(`Error: ${errorMessage}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

export const uploadFile = async (
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  const content = await file.text()
  const fileType = detectFileType(file.name, content)
  
  console.log(`📁 File upload: ${file.name} (${fileType}) - ${Math.round(file.size / 1024)}KB`)
  
  switch (fileType) {
    case 'transcript':
      await uploadTranscriptFile(file, appState, writeMessage)
      break
    case 'pdf':
      await uploadPDFFile(file, appState, writeMessage)
      break
    case 'markdown':
      await uploadMarkdownFile(file, appState, writeMessage)
      break
    case 'timeline':
      await uploadTimelineFile(file, appState, writeMessage)
      break
    case 'text':
      await uploadTextFile(file, appState, writeMessage)
      break
    default:
      writeMessage('Unsupported file type', 'error')
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
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    writeMessage(`Error: ${errorMessage}`, 'error')
    appState.isLoading = false
  }
}

export { showAuth, showJWT, saveToNosh }
