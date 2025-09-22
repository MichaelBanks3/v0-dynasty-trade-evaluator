export interface Player {
  id: string
  label: string
  position: string
  team: string
  age: number
  baseValue: number
  type: "player"
}

export const mockPlayers: Player[] = [
  // QBs
  { id: "mahomes", label: "Patrick Mahomes", position: "QB", team: "KC", age: 29, baseValue: 85, type: "player" },
  { id: "allen", label: "Josh Allen", position: "QB", team: "BUF", age: 28, baseValue: 82, type: "player" },
  { id: "burrow", label: "Joe Burrow", position: "QB", team: "CIN", age: 27, baseValue: 80, type: "player" },
  { id: "herbert", label: "Justin Herbert", position: "QB", team: "LAC", age: 25, baseValue: 78, type: "player" },
  { id: "jackson", label: "Lamar Jackson", position: "QB", team: "BAL", age: 27, baseValue: 76, type: "player" },

  // RBs
  { id: "mccaffrey", label: "Christian McCaffrey", position: "RB", team: "SF", age: 28, baseValue: 75, type: "player" },
  { id: "taylor", label: "Jonathan Taylor", position: "RB", team: "IND", age: 25, baseValue: 70, type: "player" },
  { id: "henry", label: "Derrick Henry", position: "RB", team: "BAL", age: 30, baseValue: 45, type: "player" },
  { id: "cook", label: "Dalvin Cook", position: "RB", team: "NYJ", age: 28, baseValue: 40, type: "player" },
  { id: "bijan", label: "Bijan Robinson", position: "RB", team: "ATL", age: 22, baseValue: 68, type: "player" },

  // WRs
  { id: "jefferson", label: "Justin Jefferson", position: "WR", team: "MIN", age: 25, baseValue: 90, type: "player" },
  { id: "chase", label: "Ja'Marr Chase", position: "WR", team: "CIN", age: 24, baseValue: 88, type: "player" },
  { id: "lamb", label: "CeeDee Lamb", position: "WR", team: "DAL", age: 25, baseValue: 85, type: "player" },
  { id: "hill", label: "Tyreek Hill", position: "WR", team: "MIA", age: 30, baseValue: 65, type: "player" },
  { id: "adams", label: "Davante Adams", position: "WR", team: "NYJ", age: 31, baseValue: 55, type: "player" },
  { id: "diggs", label: "Stefon Diggs", position: "WR", team: "HOU", age: 30, baseValue: 60, type: "player" },
  { id: "brown", label: "A.J. Brown", position: "WR", team: "PHI", age: 27, baseValue: 70, type: "player" },
  { id: "evans", label: "Mike Evans", position: "WR", team: "TB", age: 31, baseValue: 50, type: "player" },
  { id: "metcalf", label: "DK Metcalf", position: "WR", team: "SEA", age: 26, baseValue: 65, type: "player" },
  { id: "waddle", label: "Jaylen Waddle", position: "WR", team: "MIA", age: 25, baseValue: 68, type: "player" },

  // TEs
  { id: "kelce", label: "Travis Kelce", position: "TE", team: "KC", age: 35, baseValue: 45, type: "player" },
  { id: "andrews", label: "Mark Andrews", position: "TE", team: "BAL", age: 29, baseValue: 55, type: "player" },
  { id: "kittle", label: "George Kittle", position: "TE", team: "SF", age: 31, baseValue: 50, type: "player" },
  { id: "hockenson", label: "T.J. Hockenson", position: "TE", team: "MIN", age: 27, baseValue: 45, type: "player" },
  { id: "pitts", label: "Kyle Pitts", position: "TE", team: "ATL", age: 24, baseValue: 48, type: "player" },

  // Rookies/Young Players
  { id: "williams", label: "Caleb Williams", position: "QB", team: "CHI", age: 22, baseValue: 65, type: "player" },
  { id: "daniels", label: "Jayden Daniels", position: "QB", team: "WAS", age: 23, baseValue: 62, type: "player" },
  { id: "nabers", label: "Malik Nabers", position: "WR", team: "NYG", age: 21, baseValue: 55, type: "player" },
  { id: "odunze", label: "Rome Odunze", position: "WR", team: "CHI", age: 22, baseValue: 50, type: "player" },
  { id: "harrison", label: "Marvin Harrison Jr.", position: "WR", team: "ARI", age: 22, baseValue: 58, type: "player" },
]
