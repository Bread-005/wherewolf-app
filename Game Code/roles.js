import * as DS from "./DataStructures.js"
import * as lookup from "./Constants.js"
import * as libs from "./GameFunctions.js"

function checkNothing(Game, userID, questionLocation, Answer, phase){ //Returns true if the user has opted to do
  if (!Array.isArray(Answer)){Answer = [Answer]}

  let DoNothing = false
  console.log(userID, questionLocation)
  Answer.forEach(a => {
    DoNothing = Game.answerNothing[userID][phase][questionLocation] === a || DoNothing
  })
  
  if (DoNothing){
    libs.sendMessage(Game, userID, "All.N", [])
    return false
  }
  return true
}

export const Paranormal_Investigator = () =>{
  const Role = DS.roleTemplate("Paranormal Investigator")
  return  Role
}


export const Sentinel = () =>{
  const Role = DS.roleTemplate("Sentinel")
  Role.actionIn = 1
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Target.PCT", []) // Which player?
    Role.Information[Game.gamePhase] = "PCT"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["PCT"][0]
    if (checkNothing(Game, userID, "PCT", Answer, Game.gamePhase)){
      libs.sendMessage(Game, userID, "Target.PCS", [Game.users[Answer].name])
      libs.sendMessage(Game, "public", "Target.PCS2", [Game.users[Answer].name])
      Game.sentinelled.push(Answer)
      let tok = DS.tokenTemplate("Shield", userID)
      tok.allVisible = true
      Game.setToken(Answer, tok)
    }
  }
  
  Role.PossibleActions = {"Start" : See, "PCT": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const Thing = () =>{
  const Role = DS.roleTemplate("Thing")
  const Poke = (Game, userID) => {
    libs.sendQuestion(Game, userID, "Rand.Poke", []) //Which centre?
    Role.Information[Game.gamePhase] = "P"
  }
  
  const Poke2 = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["Poke"][0]

    if (checkNothing(Game, userID, "Poke", Answer, Game.gamePhase)){
      if (Answer === 0){
        libs.sendMessage(Game, Game.wrapIndex(userID-1), "Rand.Poked", [])
        libs.sendMessage(Game, userID, "Rand.Poke", [Game.users[Game.wrapIndex(userID-1)].name])
      } else if (Answer === 1){
        libs.sendMessage(Game, Game.wrapIndex(userID+1), "Rand.Poked", [])
        libs.sendMessage(Game, userID, "Rand.Poke", [Game.users[Game.wrapIndex(userID+1)].name])
      } else {
        libs.sendMessage(Game, userID, "All.MN", [])
      }
    }
  }  
  
  Role.PossibleActions = {"Start" : Poke, "P": Poke2}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}

export const Seer = () =>{
  const Role = DS.roleTemplate("Seer")
  Role.actionIn = 2
  const See = (Game, userID) => {    
    // Centre or Player cards?
    libs.sendQuestion(Game, userID, "Seer.CoP", []) //Centre or Player cards?
  }
  const See2 = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase-1]["CoP"][0] //Find the answer to the previous question
    
    if (Answer === 1){ //Centre
      libs.sendQuestion(Game, userID, "Seer.C", []) //Which centre?

      Role.Information[Game.gamePhase] = "C"
    }else if (Answer === 0){ //Players
      libs.sendQuestion(Game, userID, "All.PC", []) // Which player?

      Role.Information[Game.gamePhase] = "PC"

    } else {
      // Do nothing
      libs.sendMessage(Game, userID, "All.N", [])
    }
  }
  const RevealCentre = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["C"]
    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase)){
      let cardviewed1 = Game.seeCentre(Answer[0])
      let cardviewed2 = Game.seeCentre(Answer[1])
      libs.sendMessage(Game, userID, "Seer.C", [Answer[0]+1, cardviewed1.viewname, Answer[1]+1, cardviewed2.viewname])
    }
  }
  const RevealPlayer = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["PC"][0]
    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase)){
      let cardviewed = Game.seePlayerCard(Answer)
      libs.sendMessage(Game, userID, "All.PC", [cardviewed.viewname, Game.users[Answer].name])
    }
  }
  
  
  Role.PossibleActions = {"Start" : See, "Start2": See2, "C": RevealCentre, "PC": RevealPlayer}

  Role.Actions[Role.actionIn] = "Start" // Phase 3
  Role.Actions[Role.actionIn+1] = "Start2" // Phase 4
  return Role
}

export const Apprentice_Seer = () =>{
  const Role = DS.roleTemplate("Apprentice Seer")
  const See = (Game, userID) => {
    libs.sendQuestion(Game, userID, "All.C", []) //Which centre?
    Role.Information[Game.gamePhase] = "C"
  }
  
  const RevealCentre = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["C"][0]

    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase)){
      let cardviewed1 = Game.seeCentre(Answer)
      libs.sendMessage(Game, userID, "All.C", [Answer+1, cardviewed1.viewname])
    }
  }  
  
  Role.PossibleActions = {"Start" : See, "C": RevealCentre}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}

export const Robber = () =>{
  const Role = DS.roleTemplate("Robber")
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Swapper.PC", []) // Which player?
    Role.Information[Game.gamePhase] = "PC"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["PC"][0]
    if (checkNothing(Game, userID, "PC", Answer, Game.gamePhase)){
      
      if (!Game.sentinelled.includes(userID)){
        Game.swapCards(userID, Answer)
        let cardviewed = Game.seeOwnCard(userID)
        libs.sendMessage(Game, userID, "Swapper.PC", [cardviewed, Game.users[Answer].name])
      } else {
        let cardviewed = Game.seeOwnCard(userID)
        libs.sendMessage(Game, userID, "Swapper.RF", [cardviewed, Game.users[Answer].name])
      }
    }
  }
  
  Role.PossibleActions = {"Start" : See, "PC": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const Witch = () =>{
  const Role = DS.roleTemplate("Witch")
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "All.C", []) // Which card?
    Role.Actions[Game.gamePhase+1] = "C"
  }
  
  const collectCard = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase-1]["C"][0]
    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase-1)){
      libs.sendMessage(Game, userID, "All.C", [Answer, Game.centreCards[Answer].viewname])
      libs.sendQuestion(Game, userID, "Swapper.PCW", [Game.centreCards[Answer].viewname]) // Which player?
      Role.Information[Game.gamePhase] = "End"
    }
  }
  
  const swapCard = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["PCW"][0]
    let CentreAnswer = Game.answers[userID][Game.gamePhase-1]["C"][0]
    //if (checkNothing(Game, userID, "PCW", Answer, Game.gamePhase)){
      libs.sendMessage(Game, userID, "All.CS", [CentreAnswer+1, Game.users[Answer].name])
      Game.swapCards(CentreAnswer+Game.users.length, Answer)
    //}
  }
  
  Role.PossibleActions = {"Start" : See, "C": collectCard, "End" : swapCard}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}

export const Drunk = () =>{
  const Role = DS.roleTemplate("Drunk")
  Role.actionIn = 4
  const See = (Game, userID) => {
    if (!Game.sentinelled.includes(userID)){
      libs.sendQuestion(Game, userID, "Swapper.C", []) //Which centre?
      Role.Information[Game.gamePhase] = "C"
    } else {
      libs.sendMessage(Game, userID, "All.S")
    }
  }
  
  const TakeCentre = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["C"][0]
    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase)){
      Game.swapCards(userID, Game.users.length+Answer)
      libs.sendMessage(Game, userID, "Swapper.CS", [Answer+1])
    }
  }  
  
  Role.PossibleActions = {"Start" : See, "C": TakeCentre}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}


export const Insomniac = () =>{
  const Role = DS.roleTemplate("Insomniac")
  Role.actionIn = 4
 
  const RevealPlayer = (Game, userID) => {
    if (!Game.sentinelled.includes(userID)){
      let cardviewed = Game.seeOwnCard(userID)
      libs.sendMessage(Game, userID, "All.PI", [cardviewed])
    } else {
      libs.sendMessage(Game, userID, "All.S")
    }
  }
   
  Role.PossibleActions = {"PC": RevealPlayer}
  Role.Information[Role.actionIn] = "PC"
  
  return Role
}

export const Petshop_Owner = () =>{
  const Role = DS.roleTemplate("Petshop Owner")
 
  const RevealAdjacent = (Game, userID) => {
    let cardviewed1 = Game.seePlayerCard(userID+1)
    let cardviewed2 = Game.seePlayerCard(userID-1)
    if (lookup.Lists.MeetingWolves.includes(cardviewed1.current.name) || lookup.Lists.MeetingWolves.includes(cardviewed2.current.name)){
      libs.sendMessage(Game, userID, "Rand.Ravage", [])
    } else {
      libs.sendMessage(Game, userID, "Rand.NoRavage", [])
    }

    Game.users.forEach(user => {
      let u = user.position
      if (lookup.Lists.MeetingWolves.includes(Game.allCards[u].current.name)){
        if (u === Game.wrapIndex(userID +1) || u === Game.wrapIndex(userID - 1)){
          libs.sendMessage(Game, u, "Rand.YouRavage", [Game.users[userID].name])
        } else {
          libs.sendMessage(Game, u, "Rand.PotRavage", [Game.users[userID].name])
        }
      }
    })
  }  
  
  Role.PossibleActions = {"Start" : RevealAdjacent}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}

export const Parity_Sheriff = () =>{
  const Role = DS.roleTemplate("Parity Sheriff")
  Role.actionIn = 4
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)
      libs.sendQuestion(Game, userID, "Seer.PCP", [2]) // Which player?
      Role.Information[Game.gamePhase] = "Next"
      }

  const compareCards = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["PCP"]
    if (checkNothing(Game, userID, "PCP", Answer, Game.gamePhase)){
      let views = [Game.seePlayerCard(Answer[0]).alliance, Game.seePlayerCard(Answer[1]).alliance]
      let order = ["Town", "Wolf", "Neutral"]
      
      let m = "Seer.PSD"
      if (views[0] === views[1]){
        m = "Seer.PSS"
        
        if (views[0] === "Town"){
          views[0] = "Wolf"
        } else if (views[0] === "Wolf"){
          views[0] = "Town"
        } else if (views[0] === "Neutral"){
          views[0] = (Math.random() > 0.5) ? "Town" : "Wolf"
        }
      }
      
      let orderedviews = []
      order.forEach(n => {views.forEach(v => {if (n === v){orderedviews.push(v)}})})
      
      libs.sendMessage(Game, userID, m, [Game.users[Answer[0]].name, Game.users[Answer[1]].name, orderedviews[1], orderedviews[2]])
      
    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": compareCards}

  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const Troublemaker = () =>{
  const Role = DS.roleTemplate("Troublemaker")
  Role.actionIn = 4
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Troublemaker.PC", []) // Which player?
    Role.Information[Game.gamePhase] = "PC"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["PC"]
    if (checkNothing(Game, userID, "PC", Answer, Game.gamePhase)){
      libs.sendMessage(Game, userID, "Troublemaker.PC", [Game.users[Answer[0]].name, Game.users[Answer[1]].name])
      Game.swapCards(Answer[0], Answer[1])
    }
  }
  
  Role.PossibleActions = {"Start" : See, "PC": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}

export const Child = () =>{
  const Role = DS.roleTemplate("Child")
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Troublemaker.C", []) // Which two centre?
    Role.Information[Game.gamePhase] = "Next"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["C"]
    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase)){
      libs.sendMessage(Game, userID, "Troublemaker.C", [Answer[0]+1, Answer[1]+1])
      Game.swapCards(Game.users.length+Answer[0], Game.users.length+Answer[1])
    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}


export const Werewolf = () => {
  const Role = DS.roleTemplate("Werewolf")
  Role.actionIn = 2
  Role.alliance = "Wolf"
  const Meet = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Wolves = Game.allCards.filter((card, i) => {return lookup.Lists.MeetingWolves.includes(card.current.name) && card.ID !== userID && i < Game.users.length})
    if (Wolves.length === 0){
      libs.sendMessage(Game, userID, "Werewolf.C", [])
      libs.sendQuestion(Game, userID, "All.C", []) //Which centre?
      Role.Information[Game.gamePhase] = "C"
    
    } else{
      Role.Information[Game.gamePhase] = "Meeting"
    }
  }
  
  const RevealCentre = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["C"][0]
    
    if (checkNothing(Game, userID, "C", Answer, Game.gamePhase)){
      let cardviewed1 = Game.seeCentre(Answer)
      libs.sendMessage(Game, userID, "All.C", [Answer+1, cardviewed1.viewname])
    }
  }
	
  const RevealWolves = (Game, userID) => {
    libs.sendMessage(Game, userID, "Werewolf.Meeting", [])
  }
  Role.PossibleActions = {"Start": Meet, "C": RevealCentre, "Meeting": RevealWolves}

  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const Minion = () =>{
  const Role = DS.roleTemplate("Minion")
  Role.alliance = "Wolf"

  const Meet = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Wolves = Game.allCards.filter((card, i) => {return lookup.Lists.MeetingWolves.includes(card.current.name) && card.ID !== userID && i < Game.users.length})
    if (Wolves.length === 0){
      libs.sendMessage(Game, userID, "Werewolf.Minion", [])
    } else{
      Role.Information[Game.gamePhase] = "Meeting"
    }
  }
	
  Role.Actions = {actionIn: "Start"}
  Role.PossibleActions["Start"] = Meet

  return Role
}

export const Alpha_Wolf = () => {
  const Role = Werewolf()
  Role._name = "Alpha Wolf"
  Role.AlphaTarget = -1
  Role.actionIn2 = Role.actionIn +1
  
  const Move = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Target.PCT", []) // Which player?
    Role.Information[Game.gamePhase] = "PCT"
  }
  
  const EndMove = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["PCT"][0]
    if (checkNothing(Game, userID, "PCT", Answer, Game.gamePhase) && Role.AlphaTarget >= 0){
      
      libs.sendMessage(Game, userID, "All.CS", [Role.AlphaTarget+1, Game.users[Answer].name])
      Game.swapCards(Role.AlphaTarget+Game.users.length, Answer)
    }
  }
  

  Role.PossibleActions = {...Role.PossibleActions, "Start2" : Move, "PCT" : EndMove}
  Role.Actions[Role.actionIn2] = "Start2"

  return Role
}

export const Shaman_Wolf = () => {
  const Role = Werewolf()
  Role._name = "Shaman Wolf"
  Role.actionIn2 = Role.actionIn +1
  
  const Move = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Werewolf.Shaman", []) // Which player?
    Role.Information[Game.gamePhase] = "End2"
  }
  
  const EndMove = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Answer = Game.answers[userID][Game.gamePhase]["Shaman"][0]
    if (checkNothing(Game, userID, "Shaman", Answer, Game.gamePhase)){
      let appendix = "Werewolf"
      if (Answer > Game.centreCards.length){
        appendix = "Shaman Wolf"
        Answer -= Game.centreCards.length
      }
      libs.sendMessage(Game, userID, "Werewolf.Shaman", [Answer, appendix])
      Game.centreCards[Answer].hide = appendix
    }
  }
  

  Role.PossibleActions = {...Role.PossibleActions, "Start2" : Move, "End2" : EndMove}
  Role.Actions[Role.actionIn2] = "Start2"

  return Role
}

export const Mason = () =>{
  const Role = DS.roleTemplate("Mason")
  const Meet = (Game, userID) => {
    let Role = Game.getRole(userID)
    let Masons = Game.allCards.filter((card, i) => {return card.current.name === "Mason" && card.ID !== userID && i < Game.users.length})
    if (Masons.length === 0){
      libs.sendMessage(Game, userID, "Mason.N", [])
    } else{
      Role.Information[Game.gamePhase] = "Meeting"
    }
  }
	
  const RevealMasons = (Game, userID) => {
    libs.sendMessage(Game, userID, "Mason.Meeting", [])
  }
  Role.PossibleActions = {"Start": Meet, "Meeting": RevealMasons}

  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const The_Blob = () =>{
  const Role = DS.roleTemplate("The Blob")
  Role.alliance = "Neutral"
  
  const Reveal = (Game, userID) => {
  
    if (!!Game.public.Blob.length){
      return
    }
    
    if (Game.users.length <= 3){
      Game.public.Blob = [0]
    }else if (Game.users.length === 4){
      switch (Math.floor(Math.random() * 2)){
        case 0:
          Game.public.Blob = [0, 1]
          break
        case 1:
          Game.public.Blob = [-1, 0]
          break
      }
    } else if ([5, 6].includes(Game.users.length)){
      switch (Math.floor(Math.random() * 3)){
        case 0:
          Game.public.Blob = [0, 1, 2]
          break
        case 1:
          Game.public.Blob = [-2, -1, 0]
          break
        case 2:
          Game.public.Blob = [-1, 0, 1]
          break
      }
    } else if ([7, 8].includes(Game.users.length)){
      switch (Math.floor(Math.random() * 2)){
        case 0:
          Game.public.Blob = [0, 1, 2, 3]
          break
        case 1:
          Game.public.Blob = [-3, -2, -1, 0]
          break
      }
    } else if (Game.users.length >= 8){
      switch (Math.floor(Math.random() * 3)){
        case 0:
          Game.public.Blob = [0, 1, 2, 3, 4]
          break
        case 1:
          Game.public.Blob = [-4, -3, -2, -1, 0]
          break
        case 2:
          Game.public.Blob = [-2, -1, 0, 1, 2]
          break
      }
    }
    libs.sendMessage(Game, "public", "The_Blob.Absorb", [])
  }
  
  Role.PossibleActions = {"Absorb": Reveal}
  Role.Information[Role.actionIn] = "Absorb"
  return Role
}

export const Curator = () =>{
  const Role = DS.roleTemplate("Curator")
  Role.actionIn = 4
  const See = (Game, userID) => {
    
    if(!Game.public.Curator){
      let curated = ["Tanner", "Villager", "Hunter", "Bodyguard", "Prince", "Traitor", "Muting", "Poet"]
      libs.shuffleArray(curated)
      Game.public.Curator = ["Werewolf", "Nothingness"].concat(curated.splice(3))
      libs.sendMessage(Game, "public", "Curator.Token", [])
    }
    
    if(userID >= Game.users.length){return}
    
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Curator.Q", []) // Which player?
    Role.Information[Game.gamePhase] = "Next"
    //send message publically
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["Q"][0]
    if (checkNothing(Game, userID, "Q", Answer, Game.gamePhase)){
      libs.sendMessage(Game, userID, "Curator.R", [Game.users[Answer].name])      
      Game.setToken(userID, Game.public.Curator[Math.floor(Math.random() * Game.public.Curator.length)])
      
    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start" // Phase 4
  return Role
}

export const Mortician = () =>{
  const Role = DS.roleTemplate("Mortician")
  Role.actionIn = 4
  const See = (Game, userID) => {
    
    if(!Game.public.Mortician){
      let viewable = [0, 0, 1]
      
      if (Game.users.length > 5){
        viewable = [0, 1, 1]
      }
      libs.shuffleArray(viewable)
      
      libs.sendMessage(Game, "public", "Mortician.View", [])
    }
    
    if(userID >= Game.users.length){return}
    
    let Role = Game.getRole(userID)
    Role.Information[Game.gamePhase] = "Next"
  }
  
  const RevealPlayer = (Game, userID) => {
  	if(Game.public.Mortician[0] === 1){
      let n = Game.wrapIndex(userID-1)
      libs.sendMessage(Game, userID, "All.PC", [Game.users[n].name, Game.allCards[n].viewname])
    }
    if(Game.public.Mortician[1] === 1){
      libs.sendMessage(Game, userID, "All.PC", ["yourself", Game.seeOwnCard(userID)])
    }
    if(Game.public.Mortician[0] === 1){
      let n = Game.wrapIndex(userID+1)
      libs.sendMessage(Game, userID, "All.PC", [Game.users[n].name, Game.allCards[n].viewname])
    }
      
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start" // Phase 3
  return Role
}

export const Instigator = () =>{
  const Role = DS.roleTemplate("Instigator")
  Role.actionIn = 2
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Mark.PC", []) // Which player?
    Role.Information[Game.gamePhase] = "Next"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["PC"][0]
    if (checkNothing(Game, userID, "PC", Answer, Game.gamePhase)){
      Game.setMark(Answer, DS.markTemplate("Traitor", userID))
      libs.sendMessage(Game, userID, "Mark.PC", [Game.users[Answer].name, lookup.marks["Traitor"].name])

    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start"
  return Role
}


export const Priest = () =>{
  const Role = DS.roleTemplate("Priest")
  Role.actionIn = 2
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Mark.PC", []) // Which player?
    Role.Information[Game.gamePhase] = "Next"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["PC"][0]
    if (checkNothing(Game, userID, "PC", Answer, Game.gamePhase)){
      Game.setMark(Answer, DS.markTemplate("Clarity", userID))
      
      libs.sendMessage(Game, userID, "Mark.PC", [Game.users[Answer].name, lookup.marks["Clarity"].name])
    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const Assassin = () =>{
  const Role = DS.roleTemplate("Assassin")
  Role.actionIn = 2
  Role.alliance = "Neutral"
  Role.target = -1
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Mark.PC", []) // Which player?
    Role.Information[Game.gamePhase] = "Next"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["PC"][0]
    if (checkNothing(Game, userID, "PC", Answer, Game.gamePhase)){
      Game.setMark(Answer, DS.markTemplate("Assassin", userID))
      
      libs.sendMessage(Game, userID, "Mark.PC", [Game.users[Answer].name, lookup.marks["Assassin"].name])
    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start"
  return Role
}

export const Cupid = () =>{
  const Role = DS.roleTemplate("Cupid")
  Role.actionIn = 2
  const See = (Game, userID) => {
    let Role = Game.getRole(userID)

    libs.sendQuestion(Game, userID, "Mark.PC2", [2]) // Which player?
    Role.Information[Game.gamePhase] = "Next"
  }
  
  const RevealPlayer = (Game, userID) => {
    let Answer = Game.answers[userID][Game.gamePhase]["PC2"]
    if (checkNothing(Game, userID, "PC2", Answer, Game.gamePhase)){
      Game.setMark(Answer[0], DS.markTemplate("Love", userID))
      Game.setMark(Answer[1], DS.markTemplate("Love", userID))
      
      libs.sendMessage(Game, userID, "Mark.PC2", [Game.users[Answer[0]].name, Game.users[Answer[1]].name, lookup.marks["Love"].name])
    }
  }
  
  Role.PossibleActions = {"Start" : See, "Next": RevealPlayer}
  Role.Actions[Role.actionIn] = "Start"
  return Role
}





export const Villager = (Game) =>{
  const Role = DS.roleTemplate("Villager")
  return Role
}

export const Bodyguard = (Game) =>{
  const Role = DS.roleTemplate("Bodyguard")
  return Role
}

export const Prince = (Game) =>{
  const Role = DS.roleTemplate("Prince")
  return Role
}

export const Hunter = (Game) =>{
  const Role = DS.roleTemplate("Hunter")
  Role.target = -1
  return Role
}

export const Dream_Wolf = () => {
  const Role = DS.roleTemplate("Dream Wolf")
  Role.alliance = "Wolf"
  return Role
}

export const Cursed = () => {
  const Role = DS.roleTemplate("Cursed")
  return Role
}
export const Cursed_Wolf = () => {
  const Role = DS.roleTemplate("Cursed Wolf")
  Role.alliance = "Wolf"
  return Role
}

export const Sly_Fox = () => {
  const Role = DS.roleTemplate("Sly Fox")
  Role.alliance = "Neutral"
  return Role
}

export const Tanner = () => {
  const Role = DS.roleTemplate("Tanner")
  Role.alliance = "Neutral"
  return Role
}
