import { ethers } from 'ethers'

// This code is not part of the app but could be integrated as a signature mechanism

declare global {
  interface Window {
    ethereum: ethers.Provider & {
      request: (args: { method: string }) => Promise<any>
    }
  }
}

async function SignSession(markdownContent: string): Promise<void> {
  let signer = null
  const provider = new ethers.BrowserProvider(window.ethereum)

  signer = await provider.getSigner()

  // Request account access
  await window.ethereum.request({ method: 'eth_requestAccounts' })

  // Sign the markdown content
  const signature = await signer.signMessage(markdownContent)

  // Prepare the payload
  const payload = {
    content: markdownContent,
    signature: signature
  }

  // Send the payload to the Netlify function
  try {
    const response = await fetch('/.netlify/functions/ether-sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      console.log('Markdown uploaded successfully')
    } else {
      console.error('Failed to upload markdown')
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    } else {
      console.error('Error:', error)
    }
  }
}

export default SignSession
