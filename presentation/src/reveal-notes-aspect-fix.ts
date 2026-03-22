import RevealNotes from 'reveal.js/plugin/notes'

const SPEAKER_WINDOW_NAME = 'reveal.js - Notes'
const STYLE_ID = 'speaker-view-aspect-fix'

declare global {
  interface Window {
    __revealNotesWindowOpenPatched?: boolean
  }
}

function createSpeakerViewPatcher(width: number, height: number) {
  return (popup: Window | null) => {
    if (!popup) {
      return
    }

    const installPatch = () => {
      try {
        const popupDocument = popup.document

        if (!popupDocument.body) {
          popup.setTimeout(installPatch, 50)
          return
        }

        // Inject CSS to make the slide containers and iframes display correctly.
        // The containers are absolutely positioned by the notes plugin — we keep
        // that positioning but make the iframes fill them with the correct
        // aspect ratio using a scale transform so the slide viewport always
        // matches the presentation dimensions exactly.
        if (!popupDocument.getElementById(STYLE_ID)) {
          const style = popupDocument.createElement('style')
          style.id = STYLE_ID
          style.textContent = `
            #current-slide,
            #upcoming-slide {
              overflow: hidden;
            }
          `
          popupDocument.head.appendChild(style)
        }

        // Use a MutationObserver to fix each iframe's width/height attributes
        // the moment it is added to the DOM — before the nested reveal.js
        // instance initialises and reads those values to size its viewport.
        // We construct MutationObserver from the popup window's realm so that
        // instanceof checks work correctly for cross-window DOM nodes.
        const PopupMutationObserver = (popup as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver
        const observer = new PopupMutationObserver((mutations: MutationRecord[]) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if ((node as Element).nodeName === 'IFRAME') {
                fixIframeViewport(node as HTMLIFrameElement, popupDocument)
              }
            }
          }
        })

        const currentSlideEl = popupDocument.querySelector('#current-slide')
        const upcomingSlideEl = popupDocument.querySelector('#upcoming-slide')

        if (!currentSlideEl || !upcomingSlideEl) {
          popup.setTimeout(installPatch, 50)
          return
        }

        observer.observe(currentSlideEl, { childList: true })
        observer.observe(upcomingSlideEl, { childList: true })

        // Also fix any iframes that already exist (e.g. if we arrived late).
        for (const iframe of Array.from(
          popupDocument.querySelectorAll<HTMLIFrameElement>(
            '#current-slide iframe, #upcoming-slide iframe',
          ),
        )) {
          fixIframeViewport(iframe, popupDocument)
        }
      } catch {
        popup.setTimeout(installPatch, 100)
      }
    }

    // Fix the iframe viewport so the nested reveal.js instance renders at
    // exactly the presentation dimensions. We do this by:
    //   1. Setting the width/height attributes to the presentation size so the
    //      iframe's internal viewport is the right shape.
    //   2. Using a CSS scale transform to shrink that full-size viewport down
    //      to fit inside the container box, preserving the aspect ratio exactly.
    const fixIframeViewport = (
      iframe: HTMLIFrameElement,
      doc: Document,
    ) => {
      const container = iframe.parentElement
      if (!container) return

      const applyTransform = () => {
        const containerW = container.clientWidth
        const containerH = container.clientHeight
        if (!containerW || !containerH) {
          // Container not yet laid out — retry shortly.
          setTimeout(applyTransform, 16)
          return
        }

        const scaleX = containerW / width
        const scaleY = containerH / height
        const scale = Math.min(scaleX, scaleY)

        // Size the iframe to the full presentation dimensions so reveal.js
        // inside sees the correct viewport.
        iframe.setAttribute('width', String(width))
        iframe.setAttribute('height', String(height))
        iframe.style.width = `${width}px`
        iframe.style.height = `${height}px`
        iframe.style.position = 'absolute'
        iframe.style.top = '0'
        iframe.style.left = '0'
        iframe.style.transformOrigin = 'top left'
        iframe.style.transform = `scale(${scale})`

        // Centre the scaled iframe within the container.
        const scaledW = width * scale
        const scaledH = height * scale
        const offsetX = (containerW - scaledW) / 2
        const offsetY = (containerH - scaledH) / 2
        iframe.style.left = `${offsetX}px`
        iframe.style.top = `${offsetY}px`
      }

      applyTransform()

      // Re-apply on container resize so the scale stays correct.
      if (typeof doc.defaultView?.ResizeObserver !== 'undefined') {
        const ro = new doc.defaultView.ResizeObserver(applyTransform)
        ro.observe(container)
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
