import { PrismaClient, Position, PlayerStatus } from '../../lib/generated/prisma'

const prisma = new PrismaClient()

interface SleeperPlayer {
  player_id: string
  first_name: string
  last_name: string
  position: string
  team: string | null
  status: string | null
  birth_date: string | null
  years_exp: number | null
}

async function fetchSleeperPlayers(): Promise<SleeperPlayer[]> {
  console.log('Fetching players from Sleeper API...')
  
  try {
    const response = await fetch('https://api.sleeper.app/v1/players/nfl')
    if (!response.ok) {
      throw new Error(`Sleeper API error: ${response.status}`)
    }
    
    const players = await response.json()
    console.log(`Fetched ${Object.keys(players).length} total players from Sleeper`)
    
    return Object.values(players) as SleeperPlayer[]
  } catch (error) {
    console.error('Error fetching from Sleeper API:', error)
    throw error
  }
}

function mapSleeperPosition(sleeperPos: string): Position | null {
  switch (sleeperPos) {
    case 'QB': return Position.QB
    case 'RB': return Position.RB
    case 'WR': return Position.WR
    case 'TE': return Position.TE
    default: return null
  }
}

function mapSleeperStatus(sleeperStatus: string | null): PlayerStatus {
  if (!sleeperStatus) return PlayerStatus.ACTIVE
  
  switch (sleeperStatus.toLowerCase()) {
    case 'active': return PlayerStatus.ACTIVE
    case 'ir': return PlayerStatus.IR
    case 'out': return PlayerStatus.OUT
    case 'questionable': return PlayerStatus.QUESTIONABLE
    case 'doubtful': return PlayerStatus.DOUBTFUL
    case 'suspended': return PlayerStatus.SUSPENDED
    case 'retired': return PlayerStatus.RETIRED
    default: return PlayerStatus.ACTIVE
  }
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  
  try {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  } catch (error) {
    console.warn(`Invalid birth date: ${birthDate}`)
    return null
  }
}

async function ingestPlayers() {
  console.log('Starting Sleeper player ingestion...')
  
  try {
    const sleeperPlayers = await fetchSleeperPlayers()
    
    // Filter to relevant offensive players
    const relevantPlayers = sleeperPlayers.filter(player => {
      const position = mapSleeperPosition(player.position)
      return position !== null && player.team !== null
    })
    
    console.log(`Filtered to ${relevantPlayers.length} relevant offensive players`)
    
    let upserted = 0
    let skipped = 0
    
    for (const sleeperPlayer of relevantPlayers) {
      try {
        const position = mapSleeperPosition(sleeperPlayer.position)!
        const status = mapSleeperStatus(sleeperPlayer.status)
        const age = calculateAge(sleeperPlayer.birth_date)
        const name = `${sleeperPlayer.first_name} ${sleeperPlayer.last_name}`.trim()
        
        await prisma.player.upsert({
          where: { sleeperId: sleeperPlayer.player_id },
          update: {
            name,
            position,
            team: sleeperPlayer.team,
            age,
            status,
            lastUpdated: new Date(),
          },
          create: {
            sleeperId: sleeperPlayer.player_id,
            name,
            position,
            team: sleeperPlayer.team,
            age,
            dob: sleeperPlayer.birth_date ? new Date(sleeperPlayer.birth_date) : null,
            status,
          },
        })
        
        upserted++
        
        if (upserted % 100 === 0) {
          console.log(`Processed ${upserted} players...`)
        }
      } catch (error) {
        console.warn(`Error processing player ${sleeperPlayer.player_id}:`, error)
        skipped++
      }
    }
    
    console.log(`Ingestion complete!`)
    console.log(`- Upserted: ${upserted} players`)
    console.log(`- Skipped: ${skipped} players`)
    
    // Verify results
    const totalPlayers = await prisma.player.count()
    const activePlayers = await prisma.player.count({
      where: { status: PlayerStatus.ACTIVE }
    })
    
    console.log(`\nDatabase now contains:`)
    console.log(`- Total players: ${totalPlayers}`)
    console.log(`- Active players: ${activePlayers}`)
    
    if (activePlayers < 600) {
      console.warn(`⚠️  Warning: Only ${activePlayers} active players found. Target was ≥600.`)
    } else {
      console.log(`✅ Success: ${activePlayers} active players meets target of ≥600.`)
    }
    
  } catch (error) {
    console.error('Ingestion failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  ingestPlayers()
    .then(() => {
      console.log('Ingestion script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Ingestion script failed:', error)
      process.exit(1)
    })
}

export { ingestPlayers }
