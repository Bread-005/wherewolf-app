import * as DS from "./DataStructures.js"
import * as libs from "./GameFunctions.js"
import * as lookup from "./Constants.js"
//import { merge } from "rxjs"


function usersNames(Game){
  return Game.users.map(user => {return user.name})
}

export const All = {
  PC : {
    Question: "Which Player's card would you like to view?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, true, Game.sentinelled) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },
  C : {
    Question: "Which centre card would you like to view?",
    Answer(Game, userID){
      return libs.listCentres(Game.centreCards.length, [])
      },
    Count : 1,
    Vars : [],
    Default : -1
  },
  
  MPC : "You have viewed the $ card in front of $.",
  MN : "You have chosen not to act tonight.",
  MC : "Centre card $ appears to be a $.",
  MS : "Your card has a Shield token and is preventing you from completing your night action. You take no action tonight.",
  MCS : "You have swapped centre card $ with the card in front of $.",
  MPI : "You have viewed the $ card in front of yourself."
}

export const Meta = {
  Vote : {
    Question : "Who do you want to lynch?",
    Answer(Game, userID){
      let As = libs.listUsers(usersNames(Game), userID, false, false, false, []) //DisableSelf, allowNothing, DisableSentinelled
      if (Game.votePhase.Abstain){As.push(DS.QuestionAnswer("Abstain"))}
      return As
    },
    Count : 1,
    Vars : [],
    Default : -1
  },

  clientVote(userID, listOfAllUserNames, vars){
    let As = libs.listUsers(listOfAllUserNames, userID, false, false, false, []) //DisableSelf, allowNothing, DisableSentinelled
    if (vars[0]){As.push(DS.QuestionAnswer("Abstain"))}
    return As
  },

  MNoVoteLeft : "There are no remaining votes against players.\nNobody was lynched.",
  MNoVote : "Everyone voted each other.\nNobody was lynched.",
  MAbstained : "Everyone abstained.\nNobody was lynched.",
  MWin : "$"
}

export const Mark = {
  PC : {
    Question: "Which Player would you like to target?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, false, []) //DisableSelf, allowNothing, EnableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },
  PC2 : {
    Question: "Which two Players would you like to target?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, false, []) //DisableSelf, allowNothing, EnableSentinelled
    },
    Count : 2,
    Vars : [],
    Default : -1
  },

  MPC : "You have replaced the mark in front of $ with the $.",
  MPC2 : "You have replaced the marks in front of $ and $ with the $."
}

export const Target = {
  PCT : {
    Question: "Which Player's card would you like to target?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, true, Game.sentinelled) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },

  MPCS : "You have put a shield token in front of $.",
  MPCS2 : "A shield token has been placed in front of $.",
}

export const Swapper = {
  PC : {
    Question: "Which player's card would you like to take?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, true, Game.sentinelled) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },
  C : {
    Question: "Which centre card would you like to take?",
    Answer(Game, userID){
      return libs.listCentres(Game.centreCards.length, [])
      },
    Count : 1,
    Vars : [],
    Default : -1
  },

  PCW : {
    Question: "Which player's card would you like to swap with the $?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, false, true, Game.sentinelled) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },
  
  MPC : "You have taken the $ card from $ and replaced it with your own.",
  MC : "You have taken the $ centre card and replaced it with your own.",
  MRF : "Your card has a Shield token and cannot be moved. You view the $ card in front of $ and do not swap it with your own.",
  MCS : "You have swapped centre card $ with the card in front of yourself.",
}

export const Rand = {
  MRavage : "Your pet shop was raided and the Wolfie Waffles have been ravaged! You must be neighbouring a werewolf.",
  MNoRavage : "Your pet shop is safe for tonight. Neither of your neighbours are wolves.",
  MYouRavage : "$ is the Petshop Owner. Their Wolfie Waffles are irresistable and you have raided the shop.",
  MPotRavage : "$ is the Petshop Owner. They are known for their irresistable Wolfie Waffles.",
  MPoked : "You have been poked by The Thing. You must be neighbouring a The Thing.",
  MPoke : "You have poked $.",
  Poke : {
    Question: "Which player would you like to poke?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, false, []).filter((u,i) => i === Game.wrapIndex(userID+1) || i === Game.wrapIndex(userID-1) || i === usersNames.length) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },
}

export function Winning(userID, votePhase, listOfAllUserNames){
  let msgs = {
    death : new Array,
    changes : new Array,
    death2 : new Array,
    winning : new Array,
    }
  let winners = votePhase.winners
  
  if(!votePhase.highestVotes.numVotes){msgs.death.push("Everyone abstained. Nobody has died!")} //No votes
  else if (!votePhase.highestVotes.lynched.length && votePhase.highestVotes.numVotes === 1){msgs.death.push("Everyone voted for each other. Nobody has died!")} //non 0 votes, no deaths
  else{ //At least 1 death AND
    if(votePhase.highestVotes.lynched.length === 1){msgs.death.push(`${listOfAllUserNames[votePhase.highestVotes.lynched[0]]} was lynched with ${votePhase.highestVotes.numVotes} votes`)} //Only one person lynched
    else{
      let v = (votePhase.highestVotes.numVotes > 1) ? "votes" : "vote"

      let de = votePhase.highestVotes.lynched.map(p => `${listOfAllUserNames[p]}`).join("$$")
      for (let i = 0; i<votePhase.highestVotes.lynched.length-2; i++){de = de.replace("$$", ", ")}
      de = de.replace("$$", " and ")

      msgs.death.push(`Multiple people were lynched with ${votePhase.highestVotes.numVotes} ${v}: ${de}`)
    }
  }

  if (votePhase.augments.escaped && votePhase.augments.escaped.length){
    msgs.changes = votePhase.augments.escaped.map(p => {
    let reason = ""
    if(p.prince && p.bodyguard){reason = "the Prince. They were also protected by a Bodyguard"}else if(p.prince){"the Prince."}else if (p.bodyguard){"protected by a Bodyguard"}
    let v = (p.votes === 1) ? "person": "people"
    return `${listOfAllUserNames[p]} were voted by ${p.votes} ${v}, but escaped because they were ${reason}.`
    })
  }
  
  if (votePhase.augments.cursed && votePhase.augments.cursed.length){
    msgs.changes = votePhase.augments.cursed.map(p => `${listOfAllUserNames[p]} was Cursed and turned into a Werewolf!`)
  }

  if(votePhase.Hunted || votePhase.Cupid){
    //let extraDeath = [...votePhase.Hunted.map(t => t[0]), ...votePhase.Cupid.map(t => t[0])]
    votePhase.Hunted.forEach(extraDyingPair => {
      if(!votePhase.Cupid.map(t => t[0]).includes(extraDyingPair[0])){msgs.death2.push(`${listOfAllUserNames[extraDyingPair[0]]} has been shot from the lynching platform by ${listOfAllUserNames[extraDyingPair[1]]}`)}
    })
    votePhase.Cupid.forEach(extraDyingPair => {
      if(!votePhase.Hunted.map(t => t[0]).includes(extraDyingPair[0])){msgs.death2.push(`${listOfAllUserNames[extraDyingPair[0]]} taken their own life after seeing ${listOfAllUserNames[extraDyingPair[1]]} die.`)}
      else{msgs.death2.push(`${listOfAllUserNames[extraDyingPair[0]]} taken their own life after seeing ${listOfAllUserNames[extraDyingPair[1]]} die. They were also shot by ${listOfAllUserNames[votePhase.Hunter.filter(t => t[0] === extraDyingPair[0])[0][1]]}.`)}
    })
  }
  
  if(winners.users.includes(userID)){msgs.winning.push("You win!")}else if (userID !== -1 && userID !== undefined){msgs.winning.push("You lost :(")}
  if(winners.factions.Town){msgs.winning.push("Town Wins!")}
  if(winners.factions.Wolf){msgs.winning.push("Wolves Win!")}
  if(winners.factions.Minions && !winners.factions.Wolf){msgs.winning.push("Minions Win!")}
  if(winners.factions.Tanner){msgs.winning.push("Tanner Wins!")}
  if(winners.factions.Fox){msgs.winning.push("Fox Wins!")}
  if(!winners.users.length){msgs.winning.push("Nobody won :(")}
  
  return msgs
}




export const Seer = {
  CoP : {
    Question : "Do you want to see Centre cards or Player cards?",
    Answer(Game, userID){
      return [DS.QuestionAnswer("Players"), DS.QuestionAnswer("Centre"), DS.QuestionAnswer("Do Nothing")]
      },
    Count : 1,
    Vars : [],
    Default : -1
  },
  C : {
    Question: "Which two centre cards would you like to see?",
    Answer(Game, userID){
      return libs.listCentres(Game.centreCards.length, [])
      },
    Count : 2,
    Vars : [],
    Default : -1
  },
  PCP : {
    Question: "Which two player cards would you like to compare?",
    Answer(Game, userID){
      return libs.listCentres(Game.centreCards.length, [])
      },
    Count : 2,
    Vars : [],
    Default : -1
  },


  MC : "Centre card $ appears to be a $. Centre card $ appears to be a $.",
  PSD : "$ and $ are on different teams. They are $ and $ aligned.",
  PSS : "$ and $ are on the same team. They are either $ or $.",
  
}


export const Troublemaker = {
  PC : {
    Question: "Which two player's card would you like to swap?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, true, Game.sentinelled) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 2,
    Vars : [],
    Default : -1
  },
  C : {
    Question: "Which two centre card would you like to swap?",
    Answer(Game, userID){
      return libs.listCentres(Game.centreCards.length, [])
    },
    Count : 2,
    Vars : [],
    Default : -1
  },
  
  MPC : "You have swapped the cards in front of $ and $.",
  MC : "You have swapped centre card $ and centre card $.",
}




export const Werewolf = {
  FMMeeting(Game, userID, vars){
    let Wolves = Game.allCards.filter((card, i) => {return lookup.Lists.MeetingWolves.includes(card.current.name) && card.ID !== userID && card.ID < Game.users.length})
    let message = ""
    let message2 = ""
    Wolves.forEach(wolf => {
      if (Game.allCards[wolf.ID].current.name !== "Dream Wolf"){
        let dopp = (Game.allCards[wolf.ID].view === "Doppelganger" || Game.allCards[wolf.ID].view === "Copycat") ? " (" + Game.allCards[wolf.ID].view + ")" : ""
        message += Game.users[wolf.ID].name + dopp + ", "
      }
    })
    Wolves.forEach(wolf => {
      if (Game.allCards[wolf.ID].current.name === "Dream Wolf"){
        let dopp = (Game.allCards[wolf.ID].view === "Doppelganger" || Game.allCards[wolf.ID].view === "Copycat") ? " (" + Game.allCards[wolf.ID].view + ")" : ""
        message2 += Game.users[wolf.ID].name + dopp + ", "
      }
    })
    message = message.slice(0, -2)
    message2 = message2.slice(0, -2)
    if (!!message){message = `The Wolves are: ${message}.`}
    if (!!message2){message2 = `The Dream Wolves are: ${message2}.`}
    
    vars = [[message, message2]].concat(vars)
    return vars
  },
  MMeeting(vars){
    return `You wake up and meet with the wolves.\n${vars[0][0]}\n${vars[0][1]}`
  },
  MC : "There are no other wolves. You may view a centre card instead.",
  MMinion : "There are no wolves and no dreamwolves for you to work for, tonight.",

  Shaman : {
    Question: "Which centre card would you like to disguise?",
    Answer(Game, userID){
      return libs.listCentres(Game.centreCards.length, []).map(n => n+"-Werewolf").concat(libs.listCentres(Game.centreCards.length, []).map(n => n+"-Shaman Wolf"))
      },
    Count : 1,
    Vars : [],
    Default : -1
  },
  MShaman : "You have disguised centre card $ as a $."
}


export const Mason = {
  FMMeeting(Game, userID, vars){
    let Masons = Game.allCards.filter((card, i) => {return card.current.name === "Mason" && card.ID !== userID && i < Game.users.length})
    let message = ""
    Masons.forEach(mas => {
      let dopp = (Game.allCards[mas.ID].view === "Doppelganger" || Game.allCards[mas.ID].view === "Copycat") ? " (" + Game.allCards[mas.ID].view + ")" : ""
      message += Game.users[mas.ID].name + dopp + ", "
    })
    message = message.slice(0, -2)
    if (!!message){message = `They are: ${message}.`}
    
    vars = [message].concat(vars)
    return vars
  },
  MMeeting(vars){    
    return `You wake up and meet with the other Masons.\n${vars[0]}`
  },
  MN : "There are no other Masons."
}


export const The_Blob = {
  FMAbsorb(Game, userID, vars){
    vars = [JSON.stringify(Game.public.Blob)].concat(vars)
    return vars
  },
  MAbsorb(vars){
    let message = ""
    switch(vars[0]){
      case "[0]":
        message = 'The Blob is the only part of The Blob.'
        break
      case "[0,1]":
        message = "The single player below The Blobs are now part of The Blob."
        break
      case "[-1,0]":
        message = "The single player above The Blobs are now part of The Blob."
        break
      case "[0,1,2]":
        message = "The two players below The Blobs are now part of The Blob."
        break
      case "[-2,-1,0]":
        message = "The two player above The Blobs are now part of The Blob."
        break
      case "[-1,0,1]":
        message = "The single player either side of The Blobs are now part of The Blob."
        break
      case "[0,1,2,3]":
        message = "The three players below The Blobs are now part of The Blob."
        break
      case "[-3,-2,-1,0]":
        message = "The four players above The Blobs are now part of The Blob."
        break
      case "[0,1,2,3,4]":
        message = "The four players below The Blobs are now part of The Blob."
        break
      case "[-4,-3,-2,-1,0]":
        message = "The four players above The Blobs are now part of The Blob."
        break
      case "[-2,-1,0,1,2]":
        message = "The two players either side of The Blobs are now part of The Blob."
        break
    }
    return message
  }
}

export const Mortician = {
  FMView(Game, userID, vars){
    vars = [[Game.users.length, [...Game.public.Mortician]]].concat(vars)
    return vars
  },
  MView(vars){
    let message = ""
    let Mvars = vars[0]
    if (Mvars[0] >= 5){
      if (Mvars[1][0] === 0){
      message = "The Mortician may view their own card and the card to their right."
      } else if (Mvars[1][1] === 0){
      message = "The Mortician may view the card to their left and the card to their right."
      } else if (Mvars[1][2] === 0){
      message = "The Mortician may view the card to their left and their own card."
      }
    } else {
      if (Mvars[1][0] === 1){
      message = "The Mortician may view the card to their left."
      } else if (Mvars[1][1] === 1){
      message = "The Mortician may view their own card."
      } else if (Mvars[1][2] === 1){
      message = "The Mortician may view the card to their right."
      }
    }
    return message
  },
}

export const Curator = {
  MToken(Game, userID, vars){
    let m = ""
    Game.public.Curator.forEach(t => {m += t + ", "})
    m = m.slice(0, -2)
    return `The tokens the Curators might place are: ${m}.`
  },

  Q : {
    Question: "Which Player would you like to give a random token?",
    Answer(Game, userID){
      return libs.listUsers(usersNames(Game), userID, true, true, false, []) //DisableSelf, allowNothing, DisableSentinelled
    },
    Count : 1,
    Vars : [],
    Default : -1
  },

  MR : "You have put a random token in front of $.",
}
