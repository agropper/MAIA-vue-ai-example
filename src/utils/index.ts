import type { ChatHistoryItem } from '../types'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const TOKEN_LIMIT = 40000 // Adjust based on the model

const validateFileSize = (file: File) => {
  if (!file) {
    return false
  }
  return file.size <= MAX_SIZE
}

const pickFiles = () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput) {
    fileInput.click()
  }
}
const postData = async (url = '', data = {}, headers = { 'Content-Type': 'application/json' }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  try {
    return await response.json()
  } catch (error) {
    console.error('Failed to parse JSON. Probably a timeout.')
    return null
  }
}

const getSystemMessageType = (message: string): string => {
  const splitpiece = message.split('\n')[0]
  if (splitpiece.includes('timeline')) {
    return 'timeline'
  } else {
    return `${splitpiece}`
  }
}
const convertJSONtoMarkdown = (json: ChatHistoryItem[], username: string): string => {
  return (
    '### Transcript\n' +
    json
      .map((x) => {
        return `##### ${x.role}:\n${
          x.role !== 'system' ? x.content : getSystemMessageType(x.content as string)
        }`
      })
      .join('\n') +
    '\n\n##### ' +
    signatureContent(username)
  )
}

const estimateTokenCount = (text: string) => {
  const averageTokenLength = 4 // Average length of a token in characters
  return Math.ceil(text.length / averageTokenLength)
}

const checkTimelineSize = (timelineString: string) => {
  const estimatedTokens = estimateTokenCount(timelineString)
  if (estimatedTokens > TOKEN_LIMIT) {
    return {
      error: true,
      message:
        'The timeline is too large to submit. Please restart the app. It would use ' +
        estimatedTokens +
        ' tokens.'
    }
  } else {
    return {
      error: false,
      message: 'Timeline is within limits. ' + estimatedTokens + ' tokens.'
    }
  }
}

const truncateTimeline = (timelineString: string): string => {
  const lines = timelineString.split('\n')
  while (lines.length > 0) {
    const currentString = lines.join('\n')
    const estimatedTokens = estimateTokenCount(currentString)
    if (estimatedTokens <= TOKEN_LIMIT) {
      return currentString
    }
    lines.pop()
  }
  return ''
}
const signatureContent = (username: string): string => {
  return `Signed by: ${username} Date: ${new Date().toDateString()}`
}

export {
  pickFiles,
  postData,
  getSystemMessageType,
  convertJSONtoMarkdown,
  validateFileSize,
  checkTimelineSize,
  truncateTimeline,
  signatureContent
}
