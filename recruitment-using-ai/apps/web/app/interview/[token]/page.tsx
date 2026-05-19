'use client'

import React, { useState, useEffect, useRef } from 'react'

interface InterviewData {
  interviewId: string
  candidateName: string
  jobTitle: string
  questions: string[]
  status: string
  expiresAt: string
  recordingUrl?: string
}

type Stage = 'loading' | 'welcome' | 'instructions' | 'recording' | 'submitted' | 'expired' | 'error'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = params as { token: string }
  const [stage, setStage]         = useState<Stage>('loading')
  const [data, setData]           = useState<InterviewData | null>(null)
  const [currentQ, setCurrentQ]   = useState(0)
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [elapsed, setElapsed]     = useState(0)
  const [prepTime, setPrepTime]   = useState(10)
  const [inPrep, setInPrep]       = useState(false)
  const [answers, setAnswers]     = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const prepRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`${API}/api/interviews/portal/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.message === 'Interview link has expired') { setStage('expired'); return }
        if (d.message === 'Interview already completed and evaluated') { setStage('submitted'); return }
        if (d.interviewId) { setData(d); setStage('welcome') }
        else { setStage('error'); setError(d.message || 'Failed to load.') }
      })
      .catch(() => { setStage('error'); setError('Could not connect to server.') })
  }, [token])

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [recording])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true }
    })
    streamRef.current = stream
    if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const startPrep = async () => {
    setVideoBlob(null); setVideoUrl(''); setError('')
    setShowTextInput(false); setCurrentAnswer('')
    await startCamera()
    setInPrep(true); setPrepTime(10); setStage('recording')
    prepRef.current = setInterval(() => {
      setPrepTime(p => {
        if (p <= 1) { clearInterval(prepRef.current!); setInPrep(false); beginRecording(); return 0 }
        return p - 1
      })
    }, 1000)
  }

  const beginRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus' : 'video/webm'
    const mr = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 500_000 })
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setShowTextInput(true) // ── Stop తర్వాత text input show చేయి
    }
    mr.start(); mediaRef.current = mr; setRecording(true)
  }

  const stopRecording = () => {
    mediaRef.current?.stop(); setRecording(false); stopCamera()
  }

  const saveAnswerAndNext = () => {
    if (!data) return
    const updatedAnswers = [...answers]
    updatedAnswers[currentQ] = currentAnswer
    setAnswers(updatedAnswers)
    if (currentQ < data.questions.length - 1) {
      setCurrentQ(q => q + 1)
      startPrep()
    }
  }

  const submitVideo = async () => {
    if (!videoBlob) return

    // Save current answer
    const updatedAnswers = [...answers]
    updatedAnswers[currentQ] = currentAnswer
    setAnswers(updatedAnswers)

    setUploading(true)
    try {
      // Build transcript from all Q&A
      const transcript = data!.questions.map((q, i) =>
        `Q${i + 1}: ${q}\nA${i + 1}: ${updatedAnswers[i] || 'No text answer provided'}`
      ).join('\n\n')

      // First submit transcript
      const interviewId = data!.interviewId
      await fetch(`${API}/api/interviews/${interviewId}/transcript`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })

      // Then submit video
      const form = new FormData()
      form.append('video', videoBlob, 'interview.webm')
      const res = await fetch(`${API}/api/interviews/portal/${token}/submit`, {
        method: 'POST', body: form
      })
      const json = await res.json()
      if (res.ok) setStage('submitted')
      else setError(json.message || 'Upload failed.')
    } catch { setError('Network error. Please try again.') }
    finally { setUploading(false) }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0f172a 0%, transparent 50%)' }} />

      {stage === 'loading' && (
        <Center>
          <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin mb-4" />
          <p className="text-zinc-500 text-sm">Loading your interview…</p>
        </Center>
      )}

      {stage === 'expired' && (
        <Center>
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold mb-2">Link Expired</h2>
          <p className="text-zinc-400">This interview link has expired. Please contact the recruiter.</p>
        </Center>
      )}

      {stage === 'error' && (
        <Center>
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-zinc-400">{error}</p>
        </Center>
      )}

      {stage === 'submitted' && (
        <Center>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Interview Submitted!</h2>
          <p className="text-zinc-400">Thank you! AI is evaluating your responses. Results will be available shortly.</p>
        </Center>
      )}

      {stage === 'welcome' && data && (
        <Center>
          <div className="relative z-10 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 max-w-lg w-full text-center backdrop-blur-md">
            <span className="inline-block bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-4 py-1 text-xs font-semibold tracking-widest uppercase mb-6">
              Video Interview
            </span>
            <h1 className="text-3xl font-bold mb-3">Hello, {data.candidateName?.split(' ')[0] || 'Candidate'} 👋</h1>
            <p className="text-zinc-400 text-base leading-relaxed mb-6">
              You have been invited for a video interview for<br />
              <span className="text-violet-400 font-semibold">{data.jobTitle}</span>
            </p>
            <div className="flex gap-2 justify-center flex-wrap mb-8">
              {[`❓ ${data.questions.length} Questions`, `📅 Due ${new Date(data.expiresAt).toLocaleDateString()}`, '🎥 Video + Text Required'].map(t => (
                <span key={t} className="bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5 text-sm text-zinc-300">{t}</span>
              ))}
            </div>
            <button onClick={() => setStage('instructions')}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3.5 transition-colors">
              Get Started →
            </button>
          </div>
        </Center>
      )}

      {stage === 'instructions' && data && (
        <Center>
          <div className="relative z-10 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 max-w-lg w-full backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Before you begin</h2>
            <ul className="space-y-3 text-zinc-300 text-sm mb-8">
              {['✅ Allow camera & microphone access when prompted',
                '💡 Find a well-lit, quiet space',
                '⏱️ You get 10 seconds prep time per question',
                '🎬 Recording starts automatically after prep',
                '✍️ Type your answer summary after each recording',
                '📤 Submit after your final answer'].map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <button onClick={startPrep}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl py-3.5 transition-colors">
              Start Interview 🎬
            </button>
          </div>
        </Center>
      )}

      {stage === 'recording' && data && (
        <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col justify-center px-8 lg:px-16 py-12">
            <span className="inline-block self-start bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-4 py-1 text-xs font-semibold tracking-widest uppercase mb-6">
              Question {currentQ + 1} / {data.questions.length}
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold leading-snug mb-8 max-w-xl">{data.questions[currentQ]}</h2>

            {inPrep && (
              <div className="self-start bg-violet-500/10 border border-violet-500/20 rounded-2xl px-8 py-6 text-center mb-6">
                <p className="text-violet-400 text-xs font-semibold tracking-widest uppercase mb-2">Prep Time</p>
                <div className="text-6xl font-black text-white mb-1">{prepTime}s</div>
                <p className="text-zinc-500 text-xs">Recording starts automatically…</p>
              </div>
            )}

            {!inPrep && recording && (
              <>
                <div className="self-start flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  REC {fmt(elapsed)}
                </div>
                <button onClick={stopRecording}
                  className="self-start bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-8 py-3.5 transition-colors">
                  ⏹ Stop Recording
                </button>
              </>
            )}

            {!inPrep && !recording && videoUrl && (
              <div className="max-w-xl">
                <p className="text-zinc-500 text-sm mb-2">Preview your answer:</p>
                <video src={videoUrl} controls className="w-full rounded-xl mb-4 bg-zinc-900" />

                {/* ── Text Answer Input ── */}
                {showTextInput && (
                  <div className="mb-4">
                    <label className="text-zinc-400 text-sm font-semibold mb-2 block">
                      ✍️ Summarize your answer (for AI evaluation):
                    </label>
                    <textarea
                      value={currentAnswer}
                      onChange={e => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here... This helps AI evaluate your response accurately."
                      rows={4}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-violet-500 resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={startPrep}
                    className="flex-1 border border-white/10 hover:border-white/20 text-zinc-400 font-medium rounded-xl py-3 transition-colors">
                    Re-record
                  </button>
                  {currentQ < data.questions.length - 1
                    ? <button onClick={saveAnswerAndNext} disabled={!currentAnswer.trim()}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold rounded-xl py-3 transition-colors">
                        Next Question →
                      </button>
                    : <button onClick={submitVideo} disabled={uploading || !currentAnswer.trim()}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors">
                        {uploading ? 'Uploading…' : 'Submit Interview ✓'}
                      </button>
                  }
                </div>
                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
              </div>
            )}
          </div>

          <div className="bg-black/40 border-l border-white/[0.05] flex flex-col items-center justify-center p-8">
            <video ref={videoRef} autoPlay muted playsInline
              className="w-full max-w-sm rounded-2xl bg-zinc-900 aspect-[4/3] object-cover transition-all"
              style={{ border: recording ? '3px solid #ef4444' : '3px solid #27272a', opacity: recording || inPrep ? 1 : 0.5 }} />
            {!recording && !inPrep && !videoUrl && (
              <p className="text-zinc-600 text-xs mt-3">Camera preview</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {children}
    </div>
  )
}