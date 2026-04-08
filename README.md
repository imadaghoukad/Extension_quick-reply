# Quick Reply Extension

A lightweight Chrome extension that enhances your experience by adding a convenient "Quick Reply" button beneath AI model responses. It allows you to easily quote and reply to specific messages with a single click.

## ✨ Features
* **One-Click Quoting:** Instantly extracts a model's response and formats it as a markdown quote (`>`) in your input box.
* **Dynamic Injection:** Seamlessly works with Single Page Application (SPA) architectures by utilizing a `MutationObserver` to detect new messages.
* **Clean UI:** Adds a non-intrusive, beautifully animated button that matches the native web interface aesthetics.
* **Manifest V3:** Built using the latest, most secure Chrome Extension standards.

## 🚀 Installation (Developer Mode)

Since this extension is intended for personal use and development, you can install it manually:

1. Clone this repository to your local machine:
   ```bash
   git clone [https://github.com/umaad/Extension_quick-reply.git](https://github.com/umaad/Extension_quick-reply.git)

   Open Google Chrome and navigate to the extensions page: chrome://extensions/.

Toggle Developer mode ON (in the top right corner).

Click the Load unpacked button (in the top left).

Select the directory containing this repository.

💡 Usage
Once installed and enabled, navigate to the targeted site. Underneath any AI response, you will see a new Quick Reply button. Clicking it will automatically copy the text, format it as a quote block, and scroll your input box into view so you can immediately type your response.

🛠️ Technologies Used
Vanilla JavaScript

CSS3 (Animations & Styling)

Chrome Extensions API (Manifest V3)
