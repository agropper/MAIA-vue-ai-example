import {
  checkTimelineSize,
  convertJSONtoMarkdown,
  postData,
  truncateTimeline,
  validateFileSize
} from '../utils'

import type { AppState } from '../types'

/**
 * Confirms authorization to Trustee and updates the state.
 */
function showAuth(appState: AppState, writeMessage: (message: string, type: string) => void) {
  appState.isAuthorized = true
  writeMessage('Authorized', 'success')
}

/**
 * Handles the download of the patient timeline when a JWT is received.
 *
 * @param {string} jwt - The JSON Web Token received for authorization
 */
async function showJWT(
  jwt: string,
  showPopup: () => void,
  closeSession: () => void,
  writeMessage: (message: string, type: string) => void,
  appState: AppState
) {
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
    let timelineCheck = checkTimelineSize(data)
    writeMessage('Checked inbound timeline size.', 'success')
    /*
    if (timelineCheck.error === true) {
      data = truncateTimeline(data)
      timelineCheck = checkTimelineSize(data)

      if (timelineCheck.error === true) {
        appState.popupContent = 'Timeline size is too large even after truncation.'
        appState.popupContentFunction = closeSession
        showPopup()
        return
      }
    }
*/
    appState.chatHistory.push({
      role: 'system',
      content: 'timeline\n\nuploaded at ' + new Date().toLocaleString() + '\n\n' + data
    })

    appState.isLoading = false
    writeMessage('Patient Timeline Loaded', 'success')
  } catch (error: any) {
    writeMessage(`Error: ${error.message}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

/**
 * Saves the chat transcript to Nosh.
 */
async function saveToNosh(
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  showPopup: () => void,
  closeSession: () => void
) {
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

/**
 * Sends the query to AI.
 */
function sendQuery(appState: AppState, writeMessage: (message: string, type: string) => void) {
  appState.isLoading = true
  appState.activeQuestion = {
    role: 'user',
    content: appState.currentQuery || ''
  }

  postData(appState.queryuri, {
    chatHistory: appState.chatHistory,
    newValue: appState.currentQuery
  }).then((data) => {
    if (!data || data.message) {
      writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
      appState.isLoading = false
      appState.activeQuestion = {
        role: 'user',
        content: ''
      }
      return
    }
    appState.isLoading = false
    appState.activeQuestion = {
      role: 'user',
      content: ''
    }
    appState.chatHistory = data

    appState.currentQuery = ''
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
  })
}

/**
 * Handles file upload.
 */
async function uploadFile(
  file: File,
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) {
  if (!validateFileSize(file)) {
    writeMessage('File is too large to upload.', 'error')
    return
  }
  appState.isLoading = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatHistory', JSON.stringify(appState.chatHistory))
    const response = await fetch(appState.queryuri, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      writeMessage('Failed to upload file', 'error')
      return
    }
    const data = await response.json()
    if (data.chatHistory) {
      writeMessage('File uploaded', 'success')
      appState.chatHistory = data.chatHistory
    }
  } catch (error: any) {
    writeMessage(`Error: ${error.message}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

export { showAuth, showJWT, saveToNosh, sendQuery, uploadFile }
