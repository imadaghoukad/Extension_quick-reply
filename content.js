/**
 * Gemini Quick Reply — content.js
 *
 * Injects a "Quick Reply" button beneath every Gemini model response.
 * When clicked, it extracts the specific model's response text and inserts it 
 * into the user input area as a formatted quote.
 * Uses a MutationObserver to handle Gemini's SPA dynamic message loading.
 */

(() => {
  "use strict";

  // ─── Configuration ────────────────────────────────────────────────────────

  /**
   * Selectors that target Gemini's response message containers.
   * Gemini renders model turns inside <message-content> custom elements.
   */
  const MESSAGE_SELECTOR = "message-content";

  /** Sentinel attribute we stamp on each container to avoid double-injection. */
  const INJECTED_ATTR = "data-qr-injected";

  // ─── Styles ───────────────────────────────────────────────────────────────

  const STYLES = `
    .qr-btn-wrapper {
      display: flex;
      align-items: center;
      margin-top: 10px;
      padding: 0 2px 6px;
    }

    .qr-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 13px;
      border: none;
      border-radius: 20px;
      background: transparent;
      color: #8ab4f8;
      font-family: "Google Sans", Roboto, Arial, sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      letter-spacing: 0.01em;
      transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
      outline: none;
      box-shadow: inset 0 0 0 1px rgba(138, 180, 248, 0.35);
    }

    .qr-btn:hover {
      background: rgba(138, 180, 248, 0.12);
      color: #aecbfa;
      box-shadow: inset 0 0 0 1px rgba(138, 180, 248, 0.6);
    }

    .qr-btn:active {
      background: rgba(138, 180, 248, 0.22);
    }

    .qr-btn:focus-visible {
      box-shadow: inset 0 0 0 1px rgba(138, 180, 248, 0.6), 0 0 0 2px rgba(138, 180, 248, 0.4);
    }

    .qr-btn svg {
      flex-shrink: 0;
      opacity: 0.85;
    }

    @keyframes qr-flash {
      0%   { box-shadow: inset 0 0 0 1px rgba(138, 180, 248, 0.9), 0 0 8px rgba(138, 180, 248, 0.6); }
      100% { box-shadow: inset 0 0 0 1px rgba(138, 180, 248, 0.35); }
    }

    .qr-btn--flashed {
      animation: qr-flash 0.55s ease-out forwards;
    }
  `;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Injects the shared <style> tag once into the document <head>.
   */
  function injectStyles() {
    if (document.getElementById("qr-styles")) return;
    const style = document.createElement("style");
    style.id = "qr-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  /**
   * Returns the SVG icon used on the button.
   */
  function replyIconSVG() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor"
           stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true">
        <polyline points="9 17 4 12 9 7"/>
        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
      </svg>`;
  }

  /**
   * Finds the Gemini input box (the contenteditable div).
   */
  function getInputBox() {
    return (
      document.querySelector('div[contenteditable="true"][role="textbox"]') ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  /**
   * Inserts `text` into the Gemini contenteditable input box.
   * @param {string} text - The text to insert.
   * @returns {boolean} True if successful, false otherwise.
   */
  function insertReplyText(text) {
    const input = getInputBox();
    if (!input) {
      console.warn("[QuickReply] Could not find Gemini input box.");
      return false;
    }

    input.focus();

    // Place caret at the end of existing content
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(input);
    range.collapse(false); // collapse to end
    sel.removeAllRanges();
    sel.addRange(range);

    // Use execCommand so React/Angular change-detection fires correctly.
    const inserted = document.execCommand("insertText", false, text);

    if (!inserted) {
      // Fallback: manually dispatch an InputEvent
      const event = new InputEvent("input", {
        inputType: "insertText",
        data: text,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
    }

    return true;
  }

  /**
   * Creates and returns the Quick Reply button wrapper element.
   * @param {HTMLElement} container - The message container to extract text from.
   * @returns {HTMLElement} The wrapper div containing the button.
   */
  function createButton(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "qr-btn-wrapper";

    const btn = document.createElement("button");
    btn.className = "qr-btn";
    btn.setAttribute("title", "Quote and Reply");
    btn.setAttribute("aria-label", "Quote and Reply");
    btn.innerHTML = `${replyIconSVG()}<span>Quick Reply</span>`;

    btn.addEventListener("click", () => {
      // Extract the text from the specific message container
      const messageText = container.innerText.trim();

      // Format the text as a quote block
      const replyText = `> ${messageText}\n\n`;

      const success = insertReplyText(replyText);

      if (success) {
        // Visual feedback: trigger flash animation
        btn.classList.remove("qr-btn--flashed");
        void btn.offsetWidth; // Force DOM reflow
        btn.classList.add("qr-btn--flashed");

        // Scroll the input box into view
        const input = getInputBox();
        if (input) {
          input.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });

    wrapper.appendChild(btn);
    return wrapper;
  }

  /**
   * Processes a single <message-content> element.
   * @param {HTMLElement} container - The message element.
   */
  function processMessageContainer(container) {
    if (container.hasAttribute(INJECTED_ATTR)) return;

    // Only inject into model responses (skip user turns)
    const isModelResponse = !!container.closest('model-response, [data-turn-role="model"]');
    if (!isModelResponse) return;

    // Stamp it to prevent duplicate processing
    container.setAttribute(INJECTED_ATTR, "true");

    // Pass the container to createButton for text extraction
    const button = createButton(container);

    // Insert the button below the message content
    const parent = container.parentElement;
    if (parent) {
      const next = container.nextSibling;
      parent.insertBefore(button, next);
    } else {
      container.appendChild(button);
    }
  }

  /**
   * Scans the document for any unprocessed message containers.
   */
  function processAllMessages() {
    const containers = document.querySelectorAll(`${MESSAGE_SELECTOR}:not([${INJECTED_ATTR}])`);
    containers.forEach(processMessageContainer);
  }

  // ─── MutationObserver ─────────────────────────────────────────────────────

  /**
   * Sets up a MutationObserver to detect dynamically added nodes (SPA routing).
   */
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            if (node.matches?.(MESSAGE_SELECTOR) || node.querySelector?.(MESSAGE_SELECTOR)) {
              shouldScan = true;
              break;
            }
          }
        }
        if (shouldScan) break;
      }

      if (shouldScan) processAllMessages();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  function init() {
    injectStyles();
    processAllMessages(); // Handle messages already in the DOM
    startObserver();      // Watch for future dynamic messages
  }

  // Ensure DOM is fully ready before initializing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 500); // Grace period for SPA hydration
  }
})();