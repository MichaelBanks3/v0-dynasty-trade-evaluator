# Dynasty Trade Evaluator

A comprehensive tool for evaluating dynasty fantasy football trades with smart valuations and league customization.

## Features

- **Smart Player Valuations**: Age-based valuations considering current value and future potential
- **League Customization**: Support for Superflex and TE Premium scoring
- **Trade Analysis**: Win-Now vs Future analysis with fairness evaluation
- **Mock Data**: 30+ players and draft picks for testing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

\`\`\`
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── trade/            # Trade-related pages
│   └── page.tsx          # Landing page
├── components/           # Reusable components
├── data/                # Mock data for players and picks
├── lib/                 # Utilities and store
└── README.md
\`\`\`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Language**: TypeScript
- **Icons**: Lucide React

## Roadmap

- [ ] User authentication
- [ ] Database integration
- [ ] Real player data API
- [ ] Advanced valuation algorithms
- [ ] Trade history and analytics
- [ ] League integration

## Contributing

This is currently a demo application. Future contributions welcome!
