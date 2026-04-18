export function extractSaveInfo(Game){
  //When a game completes, I think we should save the roles people started as, the roles people ended as, the factions who won and the players who won, and any achievements that were unlocked.
  let users = Game.users.map(u => {
    //delete u.name
    u.history = [u.history[0], u.history.slice(-1)]
    return u
  })
  let achievements = {}//Game.achievements
  
  return {
    users,
    votePhase : Game.votePhase,
    achievements
  }
}
