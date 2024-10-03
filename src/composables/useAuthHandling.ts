import { checkTimelineSize, truncateTimeline } from '../utils'

import { useChatState } from '../composables/useChatState'

// Extracting the necessary state from useChatState
const { appState, writeMessage } = useChatState()

/**
 * Confirms authorization to Trustee and updates the state.
 */
function showAuth() {
  appState.isAuthorized = true
  writeMessage('Authorized', 'success')
}

/**
 * Handles the download of the patient timeline when a JWT is received.
 *
 * @param {string} jwt - The JSON Web Token received for authorization
 */
async function showJWT(jwt: string, showPopup: () => void, closeSession: () => void) {
  if (!appState.uri) {
    writeMessage('No URI found in Querystring or LocalStorage', 'error')
    return
  }

  appState.jwt = jwt
  writeMessage('Loading Patient Timeline...', 'success')
  appState.isLoading = true
  console.log('Loading timeline', appState.uri)
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
    console.log('Timeline loaded', data)
    // Assuming checkTimelineSize is a utility function already available
    let timelineCheck = checkTimelineSize(data)

    writeMessage('Checked inbound timeline size.', 'success')

    if (timelineCheck.error === true) {
      console.log('Timeline size error. Truncating timeline.', data)
      // Truncate the timeline to fit within the token limit
      data = truncateTimeline(data)
      timelineCheck = checkTimelineSize(data)

      if (timelineCheck.error === true) {
        console.log('Timeline size error after truncation. Clearing session.', data)
        appState.popupContent = 'Timeline size is too large even after truncation.'
        appState.popupContentFunction = closeSession
        showPopup()
        return
      } else {
        writeMessage('Timeline was truncated to fit within limits.', 'warning')
      }
    }
    appState.chatHistory.push({
      role: 'system',
      content: 'timeline\n\nuploaded at ' + new Date().toLocaleString() + '\n\n' + data
    })

    appState.isLoading = false
    writeMessage('Patient Timeline Loaded', 'success')
    console.log('Patient Timeline Loaded', data)
  } catch (error: any) {
    writeMessage(`Error: ${error.message}`, 'error')
  } finally {
    appState.isLoading = false
  }
}

export { showAuth, showJWT }
