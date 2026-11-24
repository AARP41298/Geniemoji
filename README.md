[![Github All Releases](https://img.shields.io/github/downloads/virejdasani/geniemoji/total.svg)]()
[![GitHub license](https://img.shields.io/github/license/virejdasani/geniemoji)](https://github.com/virejdasani/geniemoji/blob/master/LICENSE)
[![GitHub release](https://img.shields.io/github/release/virejdasani/geniemoji)](https://GitHub.com/virejdasani/geniemoji/releases/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Open Source? Yes!](https://badgen.net/badge/Open%20Source%20%3F/Yes%21/blue?icon=github)](https://github.com/virejdasani/geniemoji/)

<img src="https://github.com/virejdasani/Geniemoji/blob/master/assets/PreviewImg/geniemojiBanner.png" alt="Geniemoji - The emoji genie">

# Geniemoji 🧞‍♂️
The Emoji Genie

## What is Geniemoji?
Geniemoji is an app that makes using emojis on desktop simpler than ever           
It works on operating systems including Windows, MacOS, and Linux!           
It is an open source, desktop app built using Electron                         
Its purpose is to serve you with the most relevant emojis based on your command!

## How does it work?
- Geniemoji lives in your Menu Bar once the app is launched
- The app doesn't show up in the dock or anywhere else
- You can summon Geniemoji using either the shortcut keys: <kbd>Control</kbd> + <kbd>e</kbd> or by pressing its icon in the menu bar
- The shortcut keys are the same across all operating systems

## Features
- Up to date with **Unicode Emoji 18.0** (3,963 fully-qualified emoji, including 🫫 🫹 🫺 🫌 🫝 🛙 🪋 🪌 🪍)
- Search in **English** or **Spanish**, with names and keywords from Unicode CLDR
- Recently used emoji show up at the top
- Switch between **list** and **grid** view from the tray menu
- Navigate results with the arrow keys and press <kbd>Enter</kbd> to paste the selected emoji
- **Custom shortcuts** (Windows / Linux): add your own text triggers that expand to any emoji or text
- **Start at login** (Windows): launch Geniemoji when you sign in
- **Game friendly** (Windows): while a fullscreen app (game, fullscreen video, presentation) is in front, Geniemoji releases <kbd>Control</kbd> + <kbd>e</kbd> so the game gets the key, and takes it back when you leave. Toggle it with "Pause Ctrl+E in fullscreen apps" in the tray menu
- Country flags and some combined emoji that Windows can't draw are shown with Twemoji images (the real emoji is still what gets copied)

> Emoji added in Unicode 18.0 only display once your operating system's emoji font supports them.

# This is Geniemoji 🧞‍♂️
<img src="https://github.com/virejdasani/Geniemoji/blob/master/assets/PreviewImg/SC-menuBarIcon.png" alt="Geniemoji Tray Icon">

> Geniemoji lives in your menu bar 👆    

<img src="https://github.com/virejdasani/Geniemoji/blob/master/assets/PreviewImg/SC-navigation.png" alt="Geniemoji Preview Image">

> Geniemoji start page 👆       

<img src="https://github.com/virejdasani/Geniemoji/blob/master/assets/PreviewImg/SC-angryEmoji.png" alt="Geniemoji Preview Image">

> Geniemoji emoji search 👆       

<img src="https://github.com/virejdasani/Geniemoji/blob/master/assets/PreviewImg/SC-geniemoji.png" alt="Geniemoji Preview Image">

> Geniemoji emoji search 👆                
     

## Using the app
- Go to the releases tab and download the latest version for your operating system
OR
- clone the repo or download it as a zip
- Run `npm install` followed by `npm start` inside `app/windowsNlinux` (Windows / Linux) or `app/macos` (MacOS) to run Geniemoji
- See [app/README.md](app/README.md) for building the Windows installer and platform notes

## Emoji data
- The emoji list lives in `app/*/src/emojis.json` and follows the official [Unicode full emoji list](https://www.unicode.org/emoji/charts/full-emoji-list.html)
- Source files: [`assets/unicode`](assets/unicode) (`emoji-test.txt`, `emoji-sequences.txt`) and Spanish annotations from [CLDR](https://cldr.unicode.org/) in [`assets/cldr`](assets/cldr)

### Antivirus warnings (Windows)
Some antivirus products (for example McAfee) may warn about or block `Geniemoji-Setup-7.0.0.exe`. This is a false positive:
- The installer is not code-signed and is downloaded by few people, so reputation-based protection treats it as "unknown"
- To paste the emoji into the app you were using, Geniemoji presses <kbd>Control</kbd> + <kbd>v</kbd> for you, and it can start with Windows if you enable it. Behavior-based scanners sometimes flag these patterns. Since v7.0.0 the keypress is sent natively (Win32 `SendInput`) instead of through a hidden PowerShell command, which was the most common trigger
- The v7.0.0 installer scans clean on [VirusTotal (0/67 engines)](https://www.virustotal.com/gui/file/40b4c5008d1bee4f023f1748173cc4a7ecd3a46775159d9a8a32adc8dbd170ac) (SHA-256 `40b4c5008d1bee4f023f1748173cc4a7ecd3a46775159d9a8a32adc8dbd170ac`)

You can check that your download is the same file with `Get-FileHash .\Geniemoji-Setup-7.0.0.exe` in PowerShell, or upload it to VirusTotal yourself. If your antivirus still blocks it, you can restore the file from quarantine or add an exception. You can also build it yourself from source (see [app/README.md](app/README.md)).

### Check out Geniemoji on YouTube [here](https://youtu.be/2k41mwqKN9A)

## Publication(s)
- [Softpedia article on Geniemoji](https://www.softpedia.com/get/Internet/Chat/Other-Chat-Tools/Geniemoji.shtml)
