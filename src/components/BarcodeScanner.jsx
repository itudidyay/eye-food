import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { CameraOff } from 'lucide-react'

// Only grocery product formats, which makes detection faster and avoids false reads.
const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
  [DecodeHintType.TRY_HARDER, true],
])

// Turn a camera error into a message a person can act on.
function describeCameraError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Camera access was blocked. Allow camera access in your browser settings and try again, or type the barcode instead.'
  }
  if (['NotFoundError', 'OverconstrainedError', 'NotReadableError'].includes(error?.name)) {
    return 'No usable camera was found on this device. Type the barcode instead.'
  }
  return 'The camera could not start. Type the barcode instead.'
}

/**
 * Camera viewfinder that reads a UPC/EAN barcode and reports it once.
 * The camera is switched off when a barcode is found, when Cancel is pressed,
 * or when the component is removed from the screen.
 *
 * Props:
 *   onDetected(code)  called once with the barcode digits
 *   onCancel()        called when the user closes the scanner
 */
export default function BarcodeScanner({ onDetected, onCancel }) {
  const videoRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    // Camera access needs a secure page (https or localhost) and a browser that supports it.
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext
          ? 'This browser cannot use the camera. Type the barcode instead.'
          : 'The camera only works on a secure (https) website. Type the barcode instead.',
      )
      setStarting(false)
      return undefined
    }

    const video = videoRef.current
    const reader = new BrowserMultiFormatReader(HINTS)
    let controls = null
    let finished = false // true once we've reported a barcode or the scanner is closing

    // Turn the camera off: stop the scanner, then stop every track on the video stream.
    function stopCamera() {
      controls?.stop()
      video?.srcObject?.getTracks?.().forEach((track) => track.stop())
      if (video) video.srcObject = null
    }

    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result) => {
        // Called for every frame. Most frames have no barcode, which is normal, so we ignore those.
        if (result && !finished) {
          finished = true
          stopCamera()
          onDetectedRef.current(result.getText())
        }
      })
      .then((scannerControls) => {
        controls = scannerControls
        // If the user left (or a code was found) before the camera finished starting, stop it now.
        if (finished) stopCamera()
      })
      .catch((cameraError) => {
        finished = true
        setError(describeCameraError(cameraError))
        setStarting(false)
      })

    return () => {
      finished = true
      stopCamera()
    }
  }, [])

  if (error) {
    return (
      <div className="scanner scanner-error" role="alert">
        <span className="scanner-error-icon">
          <CameraOff size={24} />
        </span>
        <p>{error}</p>
        <button type="button" className="text-button" onClick={onCancel}>
          Close scanner
        </button>
      </div>
    )
  }

  return (
    <div className="scanner">
      <div className="scanner-view">
        <video ref={videoRef} muted playsInline autoPlay onPlaying={() => setStarting(false)} aria-label="Camera preview" />
        <div className="scanner-frame" aria-hidden="true">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
          <span className="scanner-line" />
        </div>
        {starting && <p className="scanner-status">Starting camera…</p>}
      </div>
      <p className="scanner-hint">Position the barcode inside the frame. It will be read automatically.</p>
      <button type="button" className="text-button" onClick={onCancel}>
        Cancel scanning
      </button>
    </div>
  )
}
