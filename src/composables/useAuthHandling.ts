import {
  processTimeline,
  convertJSONtoMarkdown,
  validateFile
} from '../utils'

import type { AppState } from '../types'

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
    writeMessage('No URI found in Querystring or LocalStorage', 'error')
    return
  }

  appState.jwt = jwt
  writeMessage('Loading Patient Timeline...', 'success')
  appState.isLoading = true
  try {
    const response = await fetch(appState.uri, {
      headers: {
        Authorization: `Bearer ${appState.jwt}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch')
    }

    let data = await response.text()
    const { timeline, hasError } = processTimeline(data, writeMessage);

    if (hasError) {
      appState.popupContent = 'Timeline size is too large. You may want to edit it manually.';
      appState.popupContentFunction = closeSession;
      showPopup();
      return;
    }

    // Handle timeline data directly in appState
    if (Array.isArray(timeline)) {
      appState.timelineChunks = timeline;
      appState.hasChunkedTimeline = true;
      appState.timeline = timeline[0].content; // Set initial timeline content
      
      // Add initial system message with first chunk
      appState.chatHistory = [{
        role: 'system',
        content: `Timeline context (${timeline[0].dateRange.start} to ${timeline[0].dateRange.end}):\n\n${timeline[0].content}`
      }];
    } else {
      appState.timeline = timeline;
      appState.hasChunkedTimeline = false;
      appState.timelineChunks = [];
      
      // Add timeline as single system message
      appState.chatHistory = [{
        role: 'system',
        content: `Timeline context:\n\n${timeline}`
      }];
    }

    appState.isLoading = false;
    writeMessage('Patient Timeline Loaded', 'success');
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
  const validation = await validateFile(file, writeMessage);
  
  if (!validation.isValid || !validation.processedContent) {
    writeMessage(validation.error || 'Invalid file', 'error');
    return;
  }

  appState.isLoading = true;
  try {
    if (Array.isArray(validation.processedContent)) {
      // Simply set the chunks and current content in memory
      appState.timelineChunks = validation.processedContent;
      appState.hasChunkedTimeline = true;
      
      const firstChunk = validation.processedContent[0];
      appState.timeline = firstChunk.content;
      
      // Set the single system message with the current chunk
      appState.chatHistory = [{
        role: 'system',
        content: `Timeline context (${firstChunk.dateRange.start} to ${firstChunk.dateRange.end}):\n\n${firstChunk.content}`
      }];
    } else {
      appState.timeline = validation.processedContent;
      appState.hasChunkedTimeline = false;
      appState.timelineChunks = [];
      
      appState.chatHistory = [{
        role: 'system',
        content: `Timeline context:\n\n${validation.processedContent}`
      }];
    }
    
    writeMessage('Timeline processed successfully', 'success');
  } catch (error: any) {
    writeMessage(`Error: ${error.message}`, 'error');
  } finally {
    appState.isLoading = false;
  }
}



const saveToNosh = async (
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  showPopup: () => void,
  closeSession: () => void
) => {
  appState.isLoading = true
  writeMessage('Saving to Nosh...', 'success')
  try {
    const response = await fetch(appState.writeuri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.jwt}`
      },
      body: JSON.stringify({
        content: convertJSONtoMarkdown(appState.chatHistory, appState.userName)
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
  }
}

export { showAuth, showJWT, saveToNosh, uploadFile }