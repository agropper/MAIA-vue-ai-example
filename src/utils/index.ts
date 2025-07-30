// utils.ts

import type { ChatHistoryItem, TimelineChunk, ValidationResult } from '../types'
import { MAX_SIZE, PAUSE_THRESHOLD, TOKEN_LIMIT } from '../types'

const createEpochOptions = (timelineChunks: any[]) => {
  return timelineChunks.map((chunk) => ({
    label: `Epoch ${chunk.epoch}`,
    value: chunk.epoch
  }))
}

const getChunkDates = (epoch: number, timelineChunks: any[]) => {
  const chunk = timelineChunks.find((c) => c.epoch === epoch)
  if (chunk) {
    return `${chunk.dateRange.start} to ${chunk.dateRange.end}`
  }
  return ''
}

const getChunkTokenCount = (epoch: number, timelineChunks: any[]) => {
  const chunk = timelineChunks.find((c) => c.epoch === epoch)
  return chunk ? chunk.tokenCount.toLocaleString() : '0'
}

const initSpeechRecognition = (
  onFinalTranscript: (transcript: string) => void,
  onInterimTranscript: (transcript: string) => void,
  onRecognitionEnd: () => void,
  onRecognitionError: (error: any) => void
) => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
          onFinalTranscript(finalTranscript)
        } else {
          interimTranscript += event.results[i][0].transcript
          onInterimTranscript(interimTranscript)
        }
      }
    }

    recognition.onend = onRecognitionEnd
    recognition.onerror = onRecognitionError

    return recognition
  }
  return null
}
const validateTimelineChunks = (
  originalString: string,
  chunks: TimelineChunk[]
): TimelineValidationResult => {
  const validation: TimelineValidationResult = {
    isValid: true,
    details: {
      originalLength: originalString.length,
      sectionsLength: 0,
      chunksLength: 0,
      differences: []
    }
  }

  // Check for specific document section
  const documentSectionMatch = originalString.match(
    /#### Document\n\n([\s\S]*?)(?=\n\n####|\n\n - \*\*|$)/
  )
  if (documentSectionMatch) {
    // Look for this content in chunks
    const documentInChunks = chunks.some((chunk) =>
      chunk.content.includes(documentSectionMatch[1].trim())
    )

    if (!documentInChunks) {
      validation.isValid = false
      validation.details.differences.push({
        type: 'MISSING_DOCUMENT_SECTION',
        message: 'Document section not found in chunks',
        context: {
          position: originalString.indexOf('#### Document'),
          sectionsContext: documentSectionMatch[1].substring(0, 100),
          chunksContext: 'Not found in chunks'
        }
      })
    }
  }

  // Original validation code continues...
  const sections = originalString.split(/(?=### )/g).filter(Boolean)

  const sectionContent = sections.join('\n')
  validation.details.sectionsLength = sectionContent.length

  const chunkContent = chunks.map((c) => c.content).join('\n')
  validation.details.chunksLength = chunkContent.length

  // Rest of the validation code...

  return validation
}

// Previous types remain the same, but add new difference type
interface TimelineValidationDifference {
  type:
    | 'LENGTH_MISMATCH'
    | 'CONTENT_DIVERGENCE'
    | 'INVALID_DATES'
    | 'SEQUENCE_ERROR'
    | 'TOKEN_LIMIT_EXCEEDED'
    | 'MISSING_DOCUMENT_SECTION'
  message: string
  context?: {
    position: number
    sectionsContext: string
    chunksContext: string
  }
}

// Types
interface TimelineValidationResult {
  isValid: boolean
  details: {
    originalLength: number
    sectionsLength: number
    chunksLength: number
    differences: TimelineValidationDifference[]
  }
}

const splitTimelineIntoChunks = (timelineString: string): TimelineChunk[] => {
  const sections = timelineString.split(/(?=### )/g).filter(Boolean)
  const patterns = [
    /([A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}:\d{2}(?:AM|PM))/,
    /([A-Z][a-z]+ \d{1,2}, \d{4})/,
    /([A-Z][a-z]+ \d{1,2},\s+\d{4})/
  ]

  const parsedSections = sections
    .map((section) => {
      let matchedDate = null
      for (const pattern of patterns) {
        const match = section.match(pattern)
        if (match) {
          const d = new Date(match[1].replace(/,\s+/, ', '))
          if (!isNaN(d.getTime())) {
            matchedDate = d
            break
          }
        }
      }

      const date = matchedDate ? matchedDate.toISOString().split('T')[0] : '1900-01-01'

      return { date, content: section }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const chunks: TimelineChunk[] = []
  let currentChunk: string[] = []
  let currentTokens = 0
  let chunkNumber = 1
  let chunkStartDate = ''
  let chunkEndDate = ''

  for (const section of parsedSections) {
    const sectionTokens = estimateTokenCount(section.content)

    if (currentTokens + sectionTokens > TOKEN_LIMIT && currentChunk.length > 0) {
      chunks.push({
        epoch: chunkNumber,
        dateRange: {
          start: chunkStartDate,
          end: chunkEndDate
        },
        content: currentChunk.join('\n'),
        tokenCount: currentTokens
      })

      chunkNumber++
      currentChunk = []
      currentTokens = 0
      chunkStartDate = ''
      chunkEndDate = ''
    }

    currentChunk.push(section.content)
    currentTokens += sectionTokens

    if (!chunkEndDate) chunkEndDate = section.date
    chunkStartDate = section.date
  }

  if (currentChunk.length > 0) {
    chunks.push({
      epoch: chunkNumber,
      dateRange: {
        start: chunkStartDate,
        end: chunkEndDate
      },
      content: currentChunk.join('\n'),
      tokenCount: currentTokens
    })
  }

  return chunks
}

const processTimeline = (
  timelineString: string,
  writeMessage: (message: string, type: 'success' | 'warning' | 'error') => void
) => {
  const cleanedTokens = estimateTokenCount(timelineString)

  if (cleanedTokens <= TOKEN_LIMIT) {
    writeMessage(`Timeline size: ${cleanedTokens.toLocaleString()} tokens`, 'success')
    return {
      timeline: timelineString,
      hasError: false
    }
  }

  const chunks = splitTimelineIntoChunks(timelineString)

  chunks.forEach((chunk) => {
    writeMessage(
      `Epoch ${chunk.epoch}: ${chunk.dateRange.start} to ${chunk.dateRange.end} (${chunk.tokenCount.toLocaleString()} tokens)`,
      'success'
    )
  })

  return {
    timeline: chunks,
    hasError: false
  }
}

const validateFile = async (
  file: File,
  writeMessage: (message: string, type: 'success' | 'warning' | 'error') => void
): Promise<ValidationResult> => {
  try {
    const content = await file.text()
    const { timeline: processedContent, hasError } = processTimeline(content, writeMessage)

    if (Array.isArray(processedContent)) {
      console.log(
        'Original size:',
        content.length,
        'Processed size:',
        processedContent.reduce((acc, chunk) => acc + chunk.content.length, 0),
        'Number of chunks:',
        processedContent.length
      )
    } else {
      console.log('Original size:', content.length, 'Processed size:', processedContent.length)
    }

    if (hasError) {
      return {
        isValid: false,
        error: 'File content exceeds token limit after processing'
      }
    }

    return {
      isValid: true,
      processedContent
    }
  } catch (error) {
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return {
      isValid: false,
      error: `Error processing file: ${errorMessage}`
    }
  }
}

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

const convertJSONtoMarkdown = (
  json: ChatHistoryItem[],
  username: string,
  includeSystem?: boolean
): string => {
  return (
    '### Transcript\n' +
    json
      .filter((x) => includeSystem || x.role !== 'system')
      .map((x) => {
        return `##### ${x.role}:\n${x.content}`
      })
      .join('\n') +
    '\n\n##### ' +
    signatureContent(username)
  )
}

const estimateTokenCount = (text: string) => {
  const averageTokenLength = 2.75
  return Math.ceil((text.length / averageTokenLength) * 1.15)
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

const parseTranscriptFromMarkdown = (markdownContent: string): ChatHistoryItem[] => {
  const chatHistory: ChatHistoryItem[] = []
  
  // Split the content by sections
  const sections = markdownContent.split(/(?=### )/g).filter(Boolean)
  
  for (const section of sections) {
    if (section.includes('### Conversation')) {
      // Extract conversation messages
      const conversationLines = section.split('\n').filter(line => line.trim())
      
      let currentRole = ''
      let currentContent = ''
      
      for (const line of conversationLines) {
        if (line.startsWith('##### ')) {
          // Save previous message if exists
          if (currentRole && currentContent.trim()) {
            chatHistory.push({
              role: currentRole as 'user' | 'assistant' | 'system',
              content: currentContent.trim()
            })
          }
          
          // Start new message
          const roleMatch = line.match(/##### (user|assistant|system):/)
          if (roleMatch) {
            currentRole = roleMatch[1]
            currentContent = ''
          }
        } else if (currentRole && line.trim()) {
          // Add content to current message
          currentContent += line + '\n'
        }
      }
      
      // Add the last message
      if (currentRole && currentContent.trim()) {
        chatHistory.push({
          role: currentRole as 'user' | 'assistant' | 'system',
          content: currentContent.trim()
        })
      }
    }
  }
  
  // If no messages were found in the conversation section, try a more flexible approach
  if (chatHistory.length === 0) {
    console.log('No messages found in conversation section, trying alternative parsing...')
    
    // Look for user and assistant messages anywhere in the content
    const lines = markdownContent.split('\n')
    let currentRole = ''
    let currentContent = ''
    
    for (const line of lines) {
      if (line.startsWith('##### user:')) {
        // Save previous message if exists
        if (currentRole && currentContent.trim()) {
          chatHistory.push({
            role: currentRole as 'user' | 'assistant' | 'system',
            content: currentContent.trim()
          })
        }
        
        // Start new user message
        currentRole = 'user'
        currentContent = ''
      } else if (line.startsWith('##### assistant:')) {
        // Save previous message if exists
        if (currentRole && currentContent.trim()) {
          chatHistory.push({
            role: currentRole as 'user' | 'assistant' | 'system',
            content: currentContent.trim()
          })
        }
        
        // Start new assistant message
        currentRole = 'assistant'
        currentContent = ''
      } else if (currentRole && line.trim() && !line.startsWith('###') && !line.startsWith('#####')) {
        // Add content to current message (skip section headers)
        currentContent += line + '\n'
      }
    }
    
    // Add the last message
    if (currentRole && currentContent.trim()) {
      chatHistory.push({
        role: currentRole as 'user' | 'assistant' | 'system',
        content: currentContent.trim()
      })
    }
  }
  
  console.log('Final parsed chat history:', chatHistory)
  return chatHistory
}

const extractTextFromPDF = async (file: File): Promise<string> => {
  // For now, return a placeholder since PDF parsing requires additional libraries
  // In a full implementation, you would use a library like pdf-parse or pdfjs-dist
  return `PDF content from ${file.name} (PDF parsing not yet implemented)`
}

const detectFileType = (fileName: string, content: string): 'transcript' | 'timeline' | 'pdf' | 'markdown' | 'text' => {
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (content.includes('### Conversation') && content.includes('##### user:') && content.includes('##### assistant:')) {
    return 'transcript'
  }
  
  if (extension === 'pdf') {
    return 'pdf'
  }
  
  if (extension === 'md' || extension === 'markdown') {
    return 'markdown'
  }
  
  if (extension === 'json') {
    return 'timeline'
  }
  
  return 'text'
}

export {
  createEpochOptions,
  getChunkDates,
  getChunkTokenCount,
  initSpeechRecognition,
  pickFiles,
  postData,
  getSystemMessageType,
  convertJSONtoMarkdown,
  validateFileSize,
  checkTimelineSize,
  truncateTimeline,
  signatureContent,
  validateFile,
  processTimeline,
  estimateTokenCount,
  PAUSE_THRESHOLD,
  parseTranscriptFromMarkdown,
  extractTextFromPDF,
  detectFileType
}
