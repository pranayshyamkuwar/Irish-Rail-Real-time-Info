# Irish Rail Live - Real-time Train Dashboard

A modern, responsive dashboard for real-time Irish Rail (Iarnród Éireann) train information. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.

![Dashboard Preview](https://img.shields.io/badge/status-live-brightgreen) ![Tech](https://img.shields.io/badge/tech-HTML%20%7C%20CSS%20%7C%20JS-blue)

## Features

- **Live Departure Board** — Real-time departures and arrivals for any station
- **Station Search** — Fuzzy search with autocomplete across 200+ stations
- **Train Journey Viewer** — Animated timeline showing all stops with progress tracking
- **Running Trains** — Overview of all currently active trains
- **Type Filters** — Filter by DART, Mainline, or Suburban services
- **Auto-refresh** — Configurable auto-refresh with countdown timer
- **Dark/Light Theme** — Toggle with preference saved to localStorage
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Deep Linking** — Share station views via URL hash (e.g., `#station=HSTON`)
- **Accessible** — ARIA labels, keyboard navigation, screen reader support

## Tech Stack

- **HTML5** — Semantic markup, Open Graph meta tags
- **CSS3** — Custom properties, Grid, Flexbox, animations, transitions
- **Vanilla JavaScript** — ES6+ modules, async/await, DOM API
- **No frameworks** — Zero dependencies, no build step required

## API

Powered by the [Iarnród Éireann Realtime API](http://api.irishrail.ie/realtime/):

| Endpoint | Description |
|----------|-------------|
| `getAllStationsXML` | List of all stations |
| `getStationDataByCodeXML_WithNumMins` | Live departures/arrivals for a station |
| `getCurrentTrainsXML` | All currently running trains |
| `getTrainMovementsXML` | All stops for a specific train |

> **Note:** The API uses XML format and does not include CORS headers. This app uses a CORS proxy chain with automatic fallback.

## Real-time Coverage

Real-time data is based on Iarnród Éireann's central signalling system. Coverage is limited in certain areas where only scheduled times are shown:

- Athlone - Westport/Ballina Line
- Cork Station & Cork - Cobh/Midleton Line
- Mallow - Tralee Line
- Ballybrophy - Limerick Line
- Limerick - Ennis Line
- Limerick Junction - Waterford Line
- Greystones - Rosslare Line
- Dundalk - Belfast Line

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/pranayshyamkuwar/Irish-Rail-Real-time-Info.git
   ```

2. Open `index.html` in your browser, or serve locally:
   ```bash
   npx serve .
   ```

3. That's it — no build step, no dependencies to install.

## Deployment

This is a static site ready for deployment on:

- **GitHub Pages** — Push to `main` branch and enable Pages in repo settings
- **Netlify / Vercel** — Connect repo and deploy
- **Any static host** — Just upload the files

## Project Structure

```
├── index.html              # Single page application
├── css/
│   ├── style.css           # Theme, layout, typography
│   ├── components.css      # Component-specific styles
│   └── animations.css      # Keyframes, transitions
├── js/
│   ├── app.js              # Main app init, state, routing
│   ├── api.js              # API client with CORS proxy
│   ├── components/
│   │   ├── stationSearch.js
│   │   ├── departureBoard.js
│   │   ├── trainTracker.js
│   │   ├── journeyViewer.js
│   │   └── filterBar.js
│   └── utils/
│       ├── xmlParser.js
│       └── helpers.js
├── assets/
│   └── favicon.svg
└── README.md
```

## License

MIT

## Author

Pranay Shyamkuwar
