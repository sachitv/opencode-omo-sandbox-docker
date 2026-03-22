import RevealNotes from 'reveal.js/plugin/notes'

const SPEAKER_WINDOW_NAME = 'reveal.js - Notes'
const STYLE_ID = 'speaker-view-aspect-fix'

declare global {
  interface Window {
    __revealNotesWindowOpenPatched?: boolean
  }
}

function createSpeakerViewPatcher(width: number, height: number) {
  const upcomingWidth = Math.round(width / 2)
  const upcomingHeight = Math.round(height / 2)
  const aspectRatio = `${width} / ${height}`

  return (popup: Window | null) => {
    if (!popup) {
      return
    }

    const installPatch = () => {
      try {
        const popupDocument = popup.document

        if (!popupDocument.head) {
          popup.setTimeout(installPatch, 50)
          return
        }

        if (!popupDocument.getElementById(STYLE_ID)) {
          const style = popupDocument.createElement('style')
          style.id = STYLE_ID
          style.textContent = `
            #current-slide,
            #upcoming-slide {
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }

            #current-slide iframe,
            #upcoming-slide iframe {
              width: 100% !important;
              height: auto !important;
              max-height: 100%;
              aspect-ratio: ${aspectRatio};
            }
          `
          popupDocument.head.appendChild(style)
        }

        const currentSlide = popupDocument.querySelector<HTMLIFrameElement>('#current-slide iframe')
        const upcomingSlide = popupDocument.querySelector<HTMLIFrameElement>('#upcoming-slide iframe')

        if (!currentSlide || !upcomingSlide) {
          popup.setTimeout(installPatch, 50)
          return
        }

        currentSlide.setAttribute('width', String(width))
        currentSlide.setAttribute('height', String(height))
        currentSlide.style.aspectRatio = aspectRatio

        upcomingSlide.setAttribute('width', String(upcomingWidth))
        upcomingSlide.setAttribute('height', String(upcomingHeight))
        upcomingSlide.style.aspectRatio = aspectRatio
      } catch {
        popup.setTimeout(installPatch, 100)
      }
    }

    popup.setTimeout(installPatch, 0)
  }
}

export function createRevealNotesAspectFix(width: number, height: number) {
  const patchSpeakerView = createSpeakerViewPatcher(width, height)
  const originalOpen = window.open.bind(window)
  const baseNotes = RevealNotes()

  if (!window.__revealNotesWindowOpenPatched) {
    window.open = (...args) => {
      const popup = originalOpen(...args)

      if (args[1] === SPEAKER_WINDOW_NAME) {
        patchSpeakerView(popup)
      }

      return popup
    }

    window.__revealNotesWindowOpenPatched = true
  }

  return baseNotes
}
