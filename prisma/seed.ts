import { PrismaClient, Position } from '../lib/generated/prisma'

const prisma = new PrismaClient()

const players = [
  // QBs
  { name: "Patrick Mahomes", position: Position.QB, team: "KC", value: 85 },
  { name: "Josh Allen", position: Position.QB, team: "BUF", value: 82 },
  { name: "Joe Burrow", position: Position.QB, team: "CIN", value: 80 },
  { name: "Justin Herbert", position: Position.QB, team: "LAC", value: 78 },
  { name: "Lamar Jackson", position: Position.QB, team: "BAL", value: 76 },
  { name: "Caleb Williams", position: Position.QB, team: "CHI", value: 65 },
  { name: "Jayden Daniels", position: Position.QB, team: "WAS", value: 62 },

  // RBs
  { name: "Christian McCaffrey", position: Position.RB, team: "SF", value: 75 },
  { name: "Jonathan Taylor", position: Position.RB, team: "IND", value: 70 },
  { name: "Bijan Robinson", position: Position.RB, team: "ATL", value: 68 },
  { name: "Derrick Henry", position: Position.RB, team: "BAL", value: 45 },
  { name: "Dalvin Cook", position: Position.RB, team: "NYJ", value: 40 },

  // WRs
  { name: "Justin Jefferson", position: Position.WR, team: "MIN", value: 90 },
  { name: "Ja'Marr Chase", position: Position.WR, team: "CIN", value: 88 },
  { name: "CeeDee Lamb", position: Position.WR, team: "DAL", value: 85 },
  { name: "A.J. Brown", position: Position.WR, team: "PHI", value: 70 },
  { name: "Jaylen Waddle", position: Position.WR, team: "MIA", value: 68 },
  { name: "Tyreek Hill", position: Position.WR, team: "MIA", value: 65 },
  { name: "DK Metcalf", position: Position.WR, team: "SEA", value: 65 },
  { name: "Stefon Diggs", position: Position.WR, team: "HOU", value: 60 },
  { name: "Davante Adams", position: Position.WR, team: "NYJ", value: 55 },
  { name: "Marvin Harrison Jr.", position: Position.WR, team: "ARI", value: 58 },
  { name: "Malik Nabers", position: Position.WR, team: "NYG", value: 55 },
  { name: "Rome Odunze", position: Position.WR, team: "CHI", value: 50 },
  { name: "Mike Evans", position: Position.WR, team: "TB", value: 50 },

  // TEs
  { name: "Mark Andrews", position: Position.TE, team: "BAL", value: 55 },
  { name: "George Kittle", position: Position.TE, team: "SF", value: 50 },
  { name: "Kyle Pitts", position: Position.TE, team: "ATL", value: 48 },
  { name: "Travis Kelce", position: Position.TE, team: "KC", value: 45 },
  { name: "T.J. Hockenson", position: Position.TE, team: "MIN", value: 45 },
]

async function main() {
  console.log('Seeding players...')
  
  // Clear existing players first
  await prisma.player.deleteMany({})
  
  // Insert new players
  await prisma.player.createMany({
    data: players
  })
  
  console.log(`Seeding completed! Inserted ${players.length} players.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })