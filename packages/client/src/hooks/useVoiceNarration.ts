import { useState, useCallback, useRef, useEffect } from 'react'

export function useVoiceNarration() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Select a preferred voice once voices are loaded
  useEffect(() => {
    function selectVoice() {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) return

      // Prefer deep/professional English voices
      const preferred = [
        'Daniel', // macOS British male
        'Alex',   // macOS US male
        'Google UK English Male',
        'Google US English',
        'Microsoft David',
        'Microsoft Mark',
      ]

      for (const name of preferred) {
        const match = voices.find((v) => v.name.includes(name) && v.lang.startsWith('en'))
        if (match) {
          voiceRef.current = match
          return
        }
      }

      // Fallback: any English voice
      const englishVoice = voices.find((v) => v.lang.startsWith('en'))
      if (englishVoice) {
        voiceRef.current = englishVoice
      }
    }

    selectVoice()

    // Chrome loads voices asynchronously
    window.speechSynthesis.addEventListener('voiceschanged', selectVoice)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', selectVoice)
    }
  }, [])

  const speak = useCallback((text: string) => {
    // Cancel any current speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 0.9
    utterance.volume = 1.0

    if (voiceRef.current) {
      utterance.voice = voiceRef.current
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  return { speak, stop, isSpeaking }
}
