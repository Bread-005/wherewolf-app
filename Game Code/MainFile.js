import * as DS from "./DataStructures.js"
import * as roles from "./roles.js"
import * as lookup from "./Constants.js"
import * as libs from "./GameFunctions.js"
import * as RandomRoles from "./RandomRoles.js"
import * as words from "./Messagetext.js"

/*
phase -1: Everyone gets a role
phase 0: Doppelganger & Copycat. Empath questions are sent
phase 1: Doppelganger/Copycat - Seer/PI/Witch
phase 2: Mark roles & all other doppel/copycat roles
phase 3: All other roles
phase 4: Witch and PI part 2
phase 5: Day (Currently nothing happens here my end.)
phase 6: Voting starts
phase 7: Voting ends. Winners are announced
*/

export function GameHandover(RoomID, Users, roleslist = [], Trueblind=false, nights=1) {
  // This should
  //create the game structure
  //prompt random role selection
  //assign roles & create cards
  //tell people their roles

  //Create the game structure
  let Game = DS.gameTemplate(RoomID)
  Game.users = Users
  Game.setup.Blind = Trueblind
  Game.setup.Nights = nights

  let roleslist2 = libs.ArrayToObject(roleslist, false, true)
  while (roleslist2.length < Users.length+3){
    roleslist2.push(DS.roleListEntry("Random Any"))
  }

  roleslist2 = RandomRoles.reroll(roleslist2, false, true, Game.setup.Blind, Game.setup.Nights, Users.length, true)

  if (!roleslist2.roles.length){
    console.log("Errors: ", roleslist2)
    return roleslist2
  }
  roleslist2 = roleslist2.roles
  if(Game.setup.Blind){Game.setup.roleslist = libs.sortRolelist(roleslist2.map(r => {return r.random}))}
  else {Game.setup.roleslist = libs.sortRolelist(roleslist2.map(r => {return r.role}))}

  libs.updateDatabase(roleslist2, "settings/deck/roles", true)
  libs.updateDatabase(Game.setup.roleslist, "settings/deck/displayRoles", true)

  //Assign roles & create cards
  prepareGameRoles(Game, roleslist2)
  Game.gamePhase = 0

  return Game
}

export function Phase0(Game) {
  //Doppelganger and Copycat
  let skip = DoNightActions(Game)

  //Do the empath here

  return skip
}

export function Phase1(Game) {
  //Doppelganger and Copycat - Seer/PI/Witch
  let skip = DoNightActions(Game)

  //Do the empath here

  return skip
}

export function Phase2(Game) { //Do the marks
  //cupid/instigator/assassin/apprentice assassin/priest/Sentinel/Guardian Angel /Doppelganger anything
  let skip = DoNightActions(Game)

  return skip
}

export function Phase3(Game) { //First round of questions
  //Never skips
  let skip = DoNightActions(Game)

  return skip
}

export function Phase4(Game) { //Second round of questions
  //witch/Paranormal Investigator
  let skip = DoNightActions(Game)

  return skip
}

export function Phase5(Game) { //Day phase
  libs.constructGame(Game)

  Game.continuePhase = 1
  libs.updateDBGame(Game)
  return false
}

export function Phase6(Game) { //Initiate voting
  libs.constructGame(Game)

  Game.users.forEach(user => {
    libs.sendQuestion(Game, user.position, "Meta.Vote", [Game.votePhase.Abstain])
  })

  Game.continuePhase = 1
  libs.updateDBGame(Game)
}

export function Phase7(Game) { //Cleanup, achievements
  libs.constructGame(Game)
  
  countVotes(Game)
  KillPeople(Game)
  let msg = ""
  console.log("These people are dying" + Game.votePhase.highestVotes.all.forEach(position => Game.users[position].name))

  let winners = Game.votePhase.winners.users
  Game.users.forEach((user, i) => {
    if (winners.includes(i)) {
      console.log(user.name + " won! :)", Game.allCards[i]._history.map(r => r.name), Game.marks[i], Game.tokens[i])
      msg += user.name + " won! :)\n"
    } else {
      console.log(user.name + " didn't win :(", Game.allCards[i]._history.map(r => r.name), Game.marks[i], Game.tokens[i])
      msg += user.name + " didn't win :(!\n"
    }
      console.log(words.Winning(i, Game.votePhase, Game.users.map(n => n.name)))
  })
  console.log(msg)
  libs.sendMessage(Game, "public", "Meta.Win", [msg])


  console.log("Game finished successfully")



  

  // Game.votePhase.highestVotes[1] who got voted
  // Game.votePhase.augments.escaped = [DS.EscapedTemplate()]

  // Game.votePhase.Hunted who got shot
  // Game.votePhase.Cupid who suicided

  // Game.votePhase.augments.cursed got cursed
  

  /*
    winningFactions = {
    Wolf : false,
    Minions : false,
    Town : false,
    Fox : false,
    Tanner : false,
    }
  */

  Game.gameEnd = true
  //Game.continuePhase = 1
  libs.updateDBGame(Game)
  
}


function DoNightActions(Game) {
  let alwaysRoles = lookup.Lists.PubliclySpeaking
  
  libs.constructGame(Game)
  
  console.log('Start of Phase'+Game.gamePhase)

  let skip = true
  lookup.AllRoles.forEach(turn => {
    Game.allCards.forEach(card => {
      if (card.current.name === turn && (card.ID < Game.users.length || alwaysRoles.includes(card.current.name))){
        let actionnum = card.current.Actions[Game.gamePhase]
        if (actionnum !== undefined) {
          let action = card.current.PossibleActions[actionnum]
          if (action) {
            console.log("Doing the action", card.ID, card.current.name, actionnum)
            action(Game, card.ID)
            skip = false
          } else {
            console.log("I failed to do the action. RIP", Game.gamePhase, actionnum)
          }
        }
      }
    })
  })
  
  //libs.updateDBGame(Game)
  Game.continuePhase = 1
  libs.updateDBGame(Game)
  return skip
}

export function resolvePhase(Game) {
  console.log("RESOLVING PHASE ", Game.gamePhase)
  libs.constructGame(Game)

  if (Game.gamePhase === 2){resolveDoppels(Game)}

  let completed = []
  lookup.AllRoles.forEach(turn => {
    Game.allCards.forEach(card => {
      if (card.current.name === turn && !completed.includes(card.ID)) {
        completed.push(card.ID)
        let infonum = card.current.Information[Game.gamePhase]
        if (infonum !== undefined) {
          let info = card.current.PossibleActions[infonum]
          if (info) { // may need to use Card.location
            console.log("Resolving an action", card.ID, card.current.name, infonum)
            info(Game, card.ID)
          } else {
            console.log("I failed to resolve an action. RIP", turn, Game.gamePhase, infonum)
          }
        }
      }
    })
  })
  Game.gamePhase++
  Game.continuePhase = 0
  Game.resolvePhase = false

  libs.updateDBGame(Game)
}

function resolveDoppels(Game){
  Game.allCards.forEach(card => {
    if (card.view.name === "Doppelganger" || card.view.name === "Copycat") {
      let infonum = card.current.Information[Game.gamePhase]
      if (infonum !== undefined) {
        let info = card.current.PossibleActions[infonum]
        if (info) { // may need to use Card.location
          console.log("Resolving a doppel action", card.ID, card.current.name)
          info(Game, card.ID)
        } else {
          console.log("I failed to resolve a doppel action. RIP", Game.gamePhase, infonum)
        }
      }
    }
  })
}

function prepareGameRoles(Game, roleslist) {
  roleslist = libs.ArrayToObject(roleslist, false, false)
  libs.shuffleArray(roleslist) // Shuffle the list of roles
  
  let count = 0
  roleslist.forEach((role, i) => { // Create cards. Save in Game.allCards. Assign roles to cards
    Game.allCards.push(DS.cardTemplate(i, roles[role.replaceAll(" ", "_")]()))
    if (role === "Alpha Wolf") {
      Game.allCards[i]._history[0].AlphaTarget = count+3
      count++
    }
  })
 
 // Add wolves to the end of the list if there are alpha wolves
  for (let n=0; n < count; n++) {
    Game.allCards.push(DS.cardTemplate(Game.allCards.length, roles["Werewolf"]()))
  }
  Game.seatUsers() // Assign positions to players
  // Cards are now assigned to players by their positions.
}

function countVotes(Game) {

  let votes = Game.answers.map((user, position) => {return DS.votesTemplate(user[Game.gamePhase-1]["Vote"][0], position)}) // [DS.votesTemplate(1, 0), DS.votesTemplate(2, 1), DS.votesTemplate(2, 2)]//, DS.votesTemplate("Abstain", 3)]

  let orderedVoterID = Game.users.map(_ => { return 0 })
  let orderedVotedAmount = Game.users.map(_ => { return 0 })

  // sort voters by userID, who they voted for
  votes.forEach(vote => {
    orderedVoterID[vote.voterID] = vote.voteFor
  })

  // sort votesAgainst by userID, how many votes they received
  votes.forEach((vote) => {
    if (vote.voteFor < Game.users.length) {
      orderedVotedAmount[vote.voteFor]++
    }
  })

  //Augment the votes and the roles
  let augments = {prince : new Array, bodyguard : new Array, cursed: new Array}

  let augmentedVotes = libs.deepcopy(orderedVotedAmount)
  orderedVotedAmount.forEach((numVotes, person) => {
    let card = Game.allCards[person]
    if (card.current.name === "Prince") {
      augmentedVotes[person] = 0
      augments.prince.push(person)
    } else if (card.current.name === "Bodyguard") {
      augmentedVotes[orderedVoterID[person]] = 0
      augments.bodyguard.push(orderedVoterID[person])
    } else if (card.current.name === "Hunter"){
      card.current.target = orderedVoterID[person]
    } else if (card.current.name === "Cursed") {
      votes.forEach(potentialWolf => {
        if (potentialWolf.voteFor === person && !augments.cursed.includes(person) && lookup.Lists.MeetingWolves.includes(Game.allCards[potentialWolf.voterID].current.name)) {
          card.become = roles["Cursed_Wolf"]()
          augments.cursed.push(person)
        }
      })
    }
  })

  // Which neutral people are town now
  // Guardian Angel
  // Prophet
  // Assassin
  // Apprentice Assassin

  Game.allCards.forEach(card => {
    if(card.current.name === "Assassin"){
      Game.marks.forEach((mark, pos) => {
        if(mark.ID === "Assassin" && mark.benefactor === card.ID){
          card.current.target === pos
        }
      })
    }
    
    if ((card.current.name === "Guardian Angel" && card.current.target === -1) ||
      (card.current.name === "Prophet" && card.current.target === -1) ||
      (card.current.name === "Assassin" && card.current.target === -1) ||
      (card.current.name === "Apprentice Assassin" && !Game.playerCards.filter(c => c.current.name === "Assassin").length)){ //No assassin players
      card.current.alliance = "Town"
    }
  })


  //Check who has the highest of the eligable dead people
  let highestVote = 0
  let highestVotees = []
  augmentedVotes.forEach((numVotes, person) => {
    if (numVotes > highestVote) {
      highestVote = numVotes
      highestVotees = [person]
    } else if (numVotes === highestVote) {
      highestVotees.push(person)
    }
  })

  if(highestVotees.length === Game.users.length){
    highestVotees = []
  }

  // List the people who were saved from death by one means or another
  let escaped = []
  orderedVotedAmount.forEach((numVotes, person) => {
    if (numVotes >= highestVote && !highestVotees.includes(person)) {
      let reason = DS.escapeTemplate(person)
      reason.prince = augments.prince.includes(person)
      reason.bodyguard = augments.bodyguard.includes(person)
      reason.votes = numVotes
      escaped.push(reason)
    }
    if (Game.allCards[person].current.name === "Sly Fox" && numVotes === 0) {
      Game.votePhase.Fox.push(person)
    } else if (Game.allCards[person].current.name === "Guardian Angel" && !orderedVotedAmount[Game.allCards[person].current.target]) {
      Game.votePhase.Angel.push(person)
    }
  })


  Game.votePhase.votes = orderedVoterID
  Game.votePhase.augments.escaped = escaped
  Game.votePhase.augments.cursed = augments.cursed
  Game.votePhase.highestVotes.numVotes = highestVote
  Game.votePhase.highestVotes.lynched = highestVotees
}

function KillPeople(Game) {

  let listofallWolves = []
  let listofallWolfAlliance = []
  let listofallTown = []

  Game.users.forEach((user, position) => {
    if(lookup.Lists.MeetingWolves.includes(Game.allCards[position].current.name)){listofallWolves.push(position)}
    if(Game.allCards[position].current.alliance === "Town"){listofallTown.push(position)}
    if(Game.allCards[position].current.alliance === "Wolf"){listofallWolfAlliance.push(position)}
  })


  let presentFactions = {
    wolves: !!Game.allCards.filter(card => {return lookup.Lists.MeetingWolves.includes(card.current.name)}).length,
    //town: !!Game.allCards.filter(card => {return lookup.Faction.Town.has(card.current.name)}).length,
    //minions : !!Game.allCards.filter(card => {return lookup.Lists.Minions.includes(card.current.name)}).length,
  }

  let winningFactions = {
    Wolf : false,
    Minions : false,
    Town : false,
    Fox : false,
    Tanner : false,
    AllLose : false,
  }

  Game.votePhase.highestVotes.all = [...Game.votePhase.highestVotes.lynched]
  let dyingpeople = Game.votePhase.highestVotes.all //set alias
  
  console.log("The number of people dying is " + Game.votePhase.highestVotes.lynched.length)
  console.log(Game)
  if (dyingpeople.length === 0) {
    if (Game.votePhase.highestVotes.numVotes === 0){
      libs.sendMessage(Game, "public", "Meta.Abstained")
    } else if (Game.votePhase.augments.escaped.length){
      libs.sendMessage(Game, "public", "Meta.NoVoteLeft")
    } else {
      libs.sendMessage(Game, "public", "Meta.NoVote")
    }
  } else {
    killDominoes(Game)
  }



  const listOfDeadTanners = Game.votePhase.highestVotes.lynched.filter(position => {return position < Game.users.length && Game.allCards[position].current.name === "Tanner"})
  const listOfWinningFoxes = Game.votePhase.Fox.filter(position => {return !dyingpeople.includes(position)})
  winningFactions.Tanner = !!listOfDeadTanners.length
  winningFactions.Fox = !!listOfWinningFoxes.length

  

  winningFactions.AllLose = winningFactions.Tanner || winningFactions.Fox

  let WolvesDead = !!listofallWolves.filter(position => dyingpeople.includes(position)).length
  winningFactions.Wolf = !winningFactions.AllLose && presentFactions.wolves && !WolvesDead
  // No tanner win, no fox win, wolves exist, no wolves dead
  
  let EvilsDead = !!listofallWolfAlliance.filter(position => dyingpeople.includes(position)).length
  winningFactions.Minions = winningFactions.Wolf || (!winningFactions.AllLose && !presentFactions.wolves && !EvilsDead)
  // If wolves win or if no tanner/fox and no wolves and no wolf allied dead

  let TownDead = !!listofallTown.filter(position => dyingpeople.includes(position)).length

  //winningFactions.Town = !winningFactions.AllLose && !winningFactions.Wolf && !winningFactions.Minions
  winningFactions.Town = true
  if(winningFactions.AllLose){winningFactions.Town = false}
  if(winningFactions.Wolf){winningFactions.Town = false}
  if(!!listofallWolves.length && !!listofallWolfAlliance.length && !EvilsDead){winningFactions.Wolf = false}
  if(!EvilsDead && TownDead){winningFactions.Town = false}
  if(dyingpeople.length === Game.users.length){winningFactions.Town = false}

  //winningFactions.Town = !(winningFactions.AllLose || ( //tanner won instead
  //  (!winningFactions.Wolf) || //wolves won instead
  //  (!presentFactions.wolves && !EvilsDead) || //minions won instead
  //  (!presentFactions.wolves && TownDead) //no wolves present and town dead
  //))

  // if fox/tanner didn't win
      // If wolves exist and wolves didn't lose, town lose
      // If minions exist and minions didn't lose, town lose
      // Else town wins

  // If a werewolf is killed or no wolves and a minion is killed or no evils in game and no town dead, then town win

  // Neutral Roles
  let winners = []
  Game.allCards.forEach((card, position) => {
    let betray = Game.getToken(position).ID === "Traitor" || Game.getMark(position).ID === "Traitor"
    
    switch (card.current.alliance){
      case "Neutral":
        switch (card.current.name){
          case "Mortician":
            if (!winningFactions.Fox && (
              (!winningFactions.Tanner && (dyingpeople.includes(Game.wrapIndex(position-1)) || dyingpeople.includes(Game.wrapIndex(position+1)))) ||
              (winningFactions.Tanner && (listOfDeadTanners.includes(Game.wrapIndex(position-1)) || listOfDeadTanners.includes(Game.wrapIndex(position+1)))) )){
              winners.push(position)
            }
            break
          case "Assassin":
            if (dyingpeople.includes(card.current.target) && (!winningFactions.Tanner  || 
              (winningFactions.Tanner && listOfDeadTanners.includes(card.current.target)))){
              winners.push(position)
            }
            break
          case "Guardian Angel":
            if((Game.votePhase.Angel.includes(position) && !dyingpeople.includes(card.current.target) && !winningFactions.Tanner) && 
            (!winningFactions.Fox || (winningFactions.Fox && listOfWinningFoxes.includes(card.current.target)))){
              winners.push(position)
            }
            break
          case "The Blob":
            let death = false
            let hasDeadFox = false
            Game.public.Blob.forEach(adjacent => {
              death = death || dyingpeople.includes(Game.wrapIndex(position+adjacent))
              hasDeadFox = hasDeadFox || (Game.seePlayerCard(position+adjacent).current.name === "Sly Fox" && !listOfWinningFoxes.includes(Game.wrapIndex(position+adjacent)))
            })
            if(!death && !winningFactions.Tanner && !hasDeadFox){
              winners.push(position)
            }
            break
          case "Sly Fox":
            if(listOfWinningFoxes.includes(position)){
              winners.push(position)
            }
            break
          case "Tanner":
            if(listOfDeadTanners.includes(position)){
              winners.push(position)
            }
            break
          case "Apprentice Tanner":
            if (!!listOfDeadTanners.length){
              winners.push(position)
            }
            break
          case "Apprentice Assassin":
            if (!winningFactions.Tanner && !!dyingpeople.filter(deadpos => {return Game.allCards[deadpos].current.name === "Assassin"}).length){
              winners.push(position)
            }
            break
        }
        break
      case "Town":
        if (
          (!betray && winningFactions.Town) || 
          (betray && (!!dyingpeople.filter(deadpos => {return deadpos !== position && deadpos < Game.users.length && Game.allCards[deadpos].current.alliance === "Town"}).length || !Game.allCards.filter((testcard, testpos) => {return testpos < Game.users.length && testcard.current.alliance === "Town" && testpos !== position}).length))
          ){
          winners.push(position)
        }
        break
      case "Wolf":
        if (
          (!betray && lookup.Lists.MeetingWolves.includes(card.current.name) && winningFactions.Wolf) ||
          (!betray && (card.current.name === "Minion" || card.current.name === "Squire") && winningFactions.Minions) ||
          (betray && (!!dyingpeople.filter(deadpos => {return deadpos !== position && deadpos < Game.users.length && Game.allCards[deadpos].current.alliance === "Wolf"}).length || !Game.allCards.filter((testcard, testpos) => {return testpos < Game.users.length && testcard.current.alliance === "Wolf" && testpos !== position}).length))
          ){
          winners.push(position)
        }
        break
    }
  })

  Game.allCards.forEach((card, position) => {
    if (card.current.name === "Prophet"){
      prophetwins(Game, winners, position)
    }
  })

  console.log("These people are dying: ", dyingpeople)
  console.log("These people are winning: ", winners)

  Game.votePhase.winners.users = winners
  for (const [key, Obj] of Object.entries(Game.votePhase.winners.factions)){
    Game.votePhase.winners.factions[key] = winningFactions[key]
  }
  //Game.votePhase.winners.factions = winningFactions
}

function prophetwins(Game, winners, current, k=new Array){
  if (k.includes(current)){
    return
  }
  k.push(current)

  let card = Game.allCards[current]
  if (card.current.target !== -1 && Game.allCards[card.current.target].current.name === "Prophet"){
    prophetwins(Game, winners, card.current.target, k)
  }
  if (winners.includes(card.current.target)){
    winners.push(current)
  }
  return
}

function killDominoes(Game){
  let newdyingpeople = []
  let evaluated = []
  do {
    newdyingpeople = killDominoesLoop(Game, Game.votePhase.highestVotes.all, evaluated)
    newdyingpeople.forEach(ndp => {if(!Game.votePhase.highestVotes.all.includes(ndp)){Game.votePhase.highestVotes.all.push(ndp)}})

  } while (newdyingpeople.length)
}

function killDominoesLoop(Game, dyingpeople, evaluated) {
  let newdyingpeopleH = []
  let newdyingpeopleC = []

  dyingpeople.forEach(deadperson => {
    if (!evaluated.includes(deadperson)) {
      evaluated.push(deadperson)
      
      // Kill Hunted
      if (Game.allCards[deadperson].current.name === "Hunter") {
        if (!dyingpeople.includes(Game.allCards[deadperson].current.target)){
          newdyingpeopleH.push(Game.allCards[deadperson].current.target)
          Game.votePhase.Hunted.push([Game.allCards[deadperson].current.target, deadperson])
        }
      }

      // Kill Cupids
      let mark = Game.getMark(deadperson)
      if(mark.ID === "Love"){
        let partner = Game.marks.map((m, i) => {if (i !== deadperson && m.ID === "Love" && m.benefactor === mark.benefactor){return i}}).filter(n => n)[0]
        if(partner){
          newdyingpeopleC.push(partner)
          Game.votePhase.Cupid.push([partner, deadperson])
        }
      }
    }
  })
  return [...newdyingpeopleC, ...newdyingpeopleH]
}


export function setup() {
  lookup.Switches.RandomiseRoles = true
  // Switch this here. Default is false.
}
