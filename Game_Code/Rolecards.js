import * as lookup from "./Constants.js"
import * as libs from "./GameFunctions.js"

// Need winCondition if neutral. Advanced = "This is the advanced text"
export const cardTemplate = (name, description, winCondition="", advanced="") => {

  let phases
  //let night = false
  let passive = false

  let alliance
  let category
  if (name.startsWith("Random")){
    let n = ["Town", "Wolf", "Neutral"]
    Object.keys(lookup.categories).forEach((major, mi) => {
      if (name.includes(major)){
        alliance = n[mi]
      }
    })
    category = name.replace("Random ", "").split(" ").slice(-1)[0]
    phases = "Any"
  } else {
    if (lookup.allPhases.none.has(name)){
      phases = 0
    } else {
      phases = []
      for (const property in lookup.allPhases){
        if (property !== "none" && lookup.allPhases[property].has(name)){
          let x = property.slice(1)
          phases.push(property)
          //night = night || Number.isInteger(x)
          passive = passive || !Number.isInteger(x)
        }
      }
    }

    let n = lookup.categories.find(name)
    alliance = n[0]
    category = n[1]
  }


  if (alliance === "Town"){
    winCondition = winCondition || "You win if any Werewolf is lynched. The Tanner must not be lynched and the Sly Fox must not go unvoted."
  } else if (alliance === "Wolf"){
    winCondition = winCondition || "You win if all Werewolves are not lynched. The Tanner must not be lynched and the Sly Fox must not go unvoted."
  }
  
  return {
    winCondition,
    phases : libs.joins(phases) || "Does not wake.",
    //night,
    passive,
    alliance,
    category,
    //fileLoc : `roleCards/${name.replaceAll(" ", "_")}.png`,
    
    name,
    description: description || "You have no actions.",
    advanced : advanced || false,
  }
}

/*
Would be nice to make a linkable object. To have separate information cards for all the marks and link it in the original role
Don't need to put probabilities in, I'm guessing
There's some advanced information to some of the roles but maybe that should only appear in the wiki
*/


const FProphet = () => {
  let description = "The Prophet, at the start of the night, chooses one player. The Prophet then views that player's card."
  let winCondition = "If the player they chose wins, the Prophet also wins."
  let advanced = "If the Prophet has no target, they join Team Town and win if any werewolf is lynched."
  return cardTemplate("Prophet", description, winCondition, advanced)
}
export const Prophet = FProphet()

const FOracle = () => {
  let description = "The Oracle must answer a random question asked publicly which can have varying results."
  let winCondition = ""
  let advanced = ` The Oracle will be asked one of the following questions: 
'Would you like to exchange your card with one from the centre?' - The Oracle may refuse. If the Oracle attempts it, there is a small chance this will be denied.
'Would you like to join the werewolf team?' - The Oracle may refuse. If the Oracle attempts it, there is a small chance this will be denied.
'Which player's card would you like to view?' - The Oracle may either see the card they selected, or be shown a different card instead. 
'Would you like to view three of the centre cards?' - The Oracle may refuse. The number of cards the Oracle can actually sees may change. 
'Do you have an even or odd player number?' - The Oracle's card parity will be revealed to everyone.
`
  return cardTemplate("Oracle", description, winCondition, advanced)
}
export const Oracle = FOracle()

const FCopycat = () => {
  let description = "The Copycat looks at one of the center cards. They take on all the properties of that role, including waking up when that card would've woken up, and doing their night action."
  let winCondition = ""
  let advanced = "If the copycat views a card with a unique mark - like the Assassin - a Drunk that takes that centre Assassin card will share the same target as you."
  return cardTemplate("Copycat", description, winCondition, advanced)
}
export const Copycat = FCopycat()

const FDoppelganger = () => {
  let description = "The Döppelganger must look at another player's card, which causes them to take on the properties of the card they looked at. If they viewed a card that has a night action, they immediately do that action (with some exceptions)."
  let winCondition = ""
  let advanced = `If the Doppelganger views one of the following, they will perform their new night action immediately:
Cupid, Instigator, Guardian Angel, Sentinel, Alpha Wolf, Shaman Wolf, Mystic Wolf, Thing, Seer, Apprentice Seer, Paranormal Investigator, Robber, Child, Witch, Troublemaker, Village Idiot, Drunk.

If the Doppelganger views one of the following, the doppelganger will do their night actions when the role is called.
Priest, Assassin, Apprentice Assassin, Petshop Owner, Werewolf, Alpha Wolf, Shaman Wolf, Mystic Wolf, Minion, Apprentice Tanner, Mason, Marksman, Pickpocket, Parity Sheriff, Analyst, Gremlin, Insomniac, Beholder, Observer Wolf, Observer Wolf, Revealer, Curator, Mortician, Exposer, Squire.

A Doppelganger who views these roles will not wake again.
Prophet, Oracle, Copycat, Doppelganger, or any roles that do not normally wake.`
  return cardTemplate("Doppelganger", description, winCondition, advanced)
}
export const Doppelganger = FDoppelganger()

const FCupid = () => {
  let description = "The Cupid selects two players at night. These two players gain the Mark of Love and fall madly in love, regardless of teams or win conditions. If either of the lovers die,  the other one will take their own life, potentially causing the death of a werewolf or other pivotal role."
  let winCondition = ""
  let advanced = "A Hunter killed by this will still take their final shot."
  return cardTemplate("Cupid", description, winCondition, advanced)
}
export const Cupid = FCupid()

const FInstigator = () => {
  let description = "The Instigator gives any player the Mark of the Traitor. The player with that mark, if they are on Team Town or Team Werewolf, wins only if someone on their team is killed -- excluding themselves. If the target is the only one on their team, the mark has no effect."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Instigator", description, winCondition, advanced)
}
export const Instigator = FInstigator()

const FPriest = () => {
  let description = "The Priest gives any player the Mark of Clarity. This replaces their current mark and does nothing. In games with more than 5 people, they automatically give themselves one too."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Priest", description, winCondition, advanced)
}
export const Priest = FPriest()

const FAssassin = () => {
  let description = "The Assassin must give any player the Mark of the Assassin. Their target knows they were given the mark. Additionally, the Assassin learns who the Apprentice Assassin(s) are, as well as if any of them are the Döppelganger Apprentices."
  let winCondition = "They win if the player with their Mark of the Assassin is lynched."
  let advanced = "It is possible that the Assassin is given to a player mid game, either with the Drunk card or with the Witch card. If this is the case, the Assassin will have no marked target. An Assassin without a target joins Team Town, and wins if any Werewolf is lynched."
  return cardTemplate("Assassin", description, winCondition, advanced)
}
export const Assassin = FAssassin()

const FApprentice_Assassin = () => {
  let description = "The Apprentice Assassin learns who the Assassin(s) are - as well as if any of them are a Döppelganger Assassins. If there is no Assassin, the Apprentice Assassin becomes an Assassin."
  let winCondition = "They win if any Assassin is lynched"
  let advanced = "It is possible that the Assassin card is present during the night phase, but moved to the centre by a Witch or Alpha Wolf. If this is the case, the Apprentice Assassin has no death target and joins Team Town, and wins if any Werewolf is lynched."
  return cardTemplate("Apprentice Assassin", description, winCondition, advanced)
}
export const Apprentice_Assassin = FApprentice_Assassin()

const FGuardian_Angel = () => {
  let description = "The Guardian Angel chooses one person at the end of the night."
  let winCondition = "They win if their target gets 0 votes and is not killed."
  let advanced = `If the Guardian Angel has no target, they join Team Town and win if any werewolf is lynched.
The Cupid and the Hunter can  be causes of death for the Guardian Angel's target -- even if the target received no votes.`
  return cardTemplate("Prophet", description, winCondition, advanced)
}
export const Guardian_Angel = FGuardian_Angel()

const FSentinel = () => {
  let description = "The Sentinel may place a Shield Token over any player's card. A card with a Shield Token cannot be moved or viewed by any player."
  let winCondition = ""
  let advanced = `An Alpha Wolf, Robber, Witch, Troublemaker, Village Idiot or Gremlin cannot move the card of a player with the Shield Token. 
A Mystic Wolf, Obserer Wolf, Seer, Paranormal Investigator, Marksman, Beholder, Mortician, Analyst or Parity Sheriff cannot look at the card of a player with the Shield Token. 
If a Robber has the Shield Token, they may only view another player's card. 
A Revealer cannot flip over the card of a player with the Shield Token. 
A Drunk or Insomniac will not do their night action if their card has a Shield Token.`
  return cardTemplate("Sentinel", description, winCondition, advanced)
}
export const Sentinel = FSentinel()

const FPetshop_Owner = () => {
  let description = "The Petshop Owner does not wake at night. All wolves - except Dream Wolves - know who the petshop owner is, and if a wolf wakes next to one, they must ravage the shop for the prized Wolfie Waffles. The Petshop Owner learns if their shop has been ravaged or not."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Petshop Owner", description, winCondition, advanced)
}
export const Petshop_Owner = FPetshop_Owner()

const FWerewolf = () => {
  let description = "The Werewolf learns who the other werewolves are. If there is only one werewolf player, they may look at one of the centre cards."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Werewolf", description, winCondition, advanced)
}
export const Werewolf = FWerewolf()

const FAlpha_Wolf = () => {
  let description = "The Alpha Wolf learns who the other werewolves are. If there is only one werewolf player, they may look at one of the centre cards. At the start of the game, one additional Werewolf is added to the end of the centre cards, which the Alpha Wolf may swap with any other player's card."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Alpha Wolf", description, winCondition, advanced)
}
export const Alpha_Wolf = FAlpha_Wolf()

const FShaman_Wolf = () => {
  let description = "The Shaman Wolf learns who the other werewolves are. If there is only one werewolf player, they may look at one of the centre cards. The Shaman Wolf may additionally view one of the centre cards and enchant it as their choice of either Shaman Wolf or Werewolf. If they do, any player who views that card for the rest of the game instead views it as the Shaman's choice."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Shaman Wolf", description, winCondition, advanced)
}
export const Shaman_Wolf = FShaman_Wolf()

const FMystic_Wolf = () => {
  let description = "The Mystic Wolf learns who the other werewolves are. If there is only one werewolf player, they may look at one of the centre cards. The Mystic Wolf may additionally view any other player's card."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Mystic Wolf", description, winCondition, advanced)
}
export const Mystic_Wolf = FMystic_Wolf()

const FMinion = () => {
  let description = "The Minion learns who the werewolves are, but the werewolves don't learn who the minion is."
  let winCondition = "They are on Team Werewolf. If there are wolf players, they win if no werewolves are lynched, even if they themselves are lynched. If there are no wolf players, they win if nobody on their team is lynched."
  let advanced = "The Minion's team consists of Werewolves, Minions and Squires."
  return cardTemplate("Minion", description, winCondition, advanced)
}
export const Minion = FMinion()

const FApprentice_Tanner = () => {
  let description = "The Apprentice Tanner learns who the tanner(s) are. If there are no tanners, the Apprentice Tanner becomes a Tanner."
  let winCondition = "They win if any Tanner is lynched."
  let advanced = ""
  return cardTemplate("Apprentice Tanner", description, winCondition, advanced)
}
export const Apprentice_Tanner = FApprentice_Tanner()

const FMason = () => {
  let description = "The Mason learns who the other Mason(s) are."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Mason", description, winCondition, advanced)
}
export const Mason = FMason()

const FThing = () => {
  let description = "The Thing may alert one of their neighbours that there is a Thing besides them. The neighbour does not know which side of them The Thing is."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Thing", description, winCondition, advanced)
}
export const Thing = FThing()

const FSeer = () => {
  let description = "The Seer may view another player's card, or two of the centre cards."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Seer", description, winCondition, advanced)
}
export const Seer = FSeer()

const FApprentice_Seer = () => {
  let description = "The Apprentice Seer may view one of the centre cards."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Apprentice Seer", description, winCondition, advanced)
}
export const Apprentice_Seer = FApprentice_Seer()

const FParanormal_Investigator = () => {
  let description = "The Paranormal Investigator may investigate up to two other players' cards. If they view the card of a player that is not on Team Town, they become that role and gain its win condition."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Paranormal_Investigator", description, winCondition, advanced)
}
export const Paranormal_Investigator = FParanormal_Investigator()

const FMarksman = () => {
  let description = "The Marksman may view another player's card, and then view a different player's mark."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Marksman", description, winCondition, advanced)
}
export const Marksman = FMarksman()

const FRobber = () => {
  let description = "The Robber may swap their card with any other player's card. They then view their new card."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Robber", description, winCondition, advanced)
}
export const Robber = FRobber()

const FChild = () => {
  let description = "The Child may blindly swap two of the centre cards."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Child", description, winCondition, advanced)
}
export const Child = FChild()

const FWitch = () => {
  let description = "The Witch may look at one of the centre cards. If they do, they must swap that card with any player's card."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Witch", description, winCondition, advanced)
}
export const Witch = FWitch()

const FPickpocket = () => {
  let description = "The Pickpocket may swap their mark with any other player's mark. They then view their new mark."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Pickpocket", description, winCondition, advanced)
}
export const Pickpocket = FPickpocket()

const FParity_Sheriff = () => {
  let description = "The Parity Sheriff may select two other players. If both players belong to different teams, the Parity Sheriff identifies the teams but not which card belongs to each. If the cards are from the same team, the Parity Sheriff learns that they are on the same team and are given two options for which team it may be."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Parity Sheriff", description, winCondition, advanced)
}
export const Parity_Sheriff = FParity_Sheriff()

const FAnalyst = () => {
  let description = "At night, the Analyst may check one player's card and one centre card and be given the result 'Guilty' or 'Not Guilty' for each. A Rational Analyst views Town aligned cards as 'Not Guilty' and all other cards as 'Guilty', but the Analyst subtype is random and the results may lie. See advanced for more."
  let winCondition = ""
  let advanced = `The Analyst does not know which subtype they have.
  A Rational Analyst views Town cards as 'Not Guilty' and all other cards as 'Guilty'.
  An Insane Analyst views Town cards as 'Guilty' and all other cards as 'Not Guilty'.
  A Paranoid Analyst views all cards as 'Guilty'.
  A Confused Analyst views cards as randomly 'Guilty' or 'Not Guilty'.`
  return cardTemplate("Template", description, winCondition, advanced)
}
export const Analyst = FAnalyst()

const FTroublemaker = () => {
  let description = "The Troublemaker may blindly swap the cards of any two other players."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Troublemaker", description, winCondition, advanced)
}
export const Troublemaker = FTroublemaker()

const FVillage_Idiot = () => {
  let description = "The Village Idiot may swap everyone else's card around, either clockwise or anticlockwise around the table."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Village Idiot", description, winCondition, advanced)
}
export const Village_Idiot = FVillage_Idiot()

const FGremlin = () => {
  let description = "The Gremlin may blindly swap the marks or cards of any two players (including their own)."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Gremlin", description, winCondition, advanced)
}
export const Gremlin = FGremlin()

const FDrunk = () => {
  let description = "The Drunk must swap their card blindly with one of the centre cards."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Drunk", description, winCondition, advanced)
}
export const Drunk = FDrunk()

const FInsomniac = () => {
  let description = "The Insomniac views their own card at the end of the night."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Insomniac", description, winCondition, advanced)
}
export const Insomniac = FInsomniac()

const FSquire = () => {
  let description = "The Squire learns who the wolves are, and views their cards at the end of the night to see if they were swapped."
  let winCondition = "They are on Team Werewolf. If there are wolf players, they win if no werewolves are lynched, even if they themselves are lynched. If there are no wolf players, they win if nobody on their team is lynched."
  let advanced = "The Squire's team consists of Werewolves, Minions and Squires."
  return cardTemplate("Squire", description, winCondition, advanced)
}
export const Squire = FSquire()

const FBeholder = () => {
  let description = "The Beholder learns who the Seer and Apprentice Seer are, and views their cards at the end of the night to see if they were swapped"
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Beholder", description, winCondition, advanced)
}
export const Beholder = FBeholder()

const FObserver_Wolf = () => {
  let description = "The Observer Wolf learns who the other werewolves are. If there is only one werewolf player, they may look at one of the centre cards. Additonally at the end of the night, The Observer Wolf may choose one player and then learn if their target has the same card as the one they started with."
  let winCondition = ""
  let advanced = "The Observer Wolf cannot tell the difference between two identical roles. They also cannot tell the difference between a Doppelganger and Doppelganger-turned-Werewolf."
  return cardTemplate("Observer Wolf", description, winCondition, advanced)
}
export const Observer_Wolf = FObserver_Wolf()

const FRevealer = () => {
  let description = "The Revealer may turn over any other player's card. If they reveal the card of a player that is not on Team Town, they must turn it face down again; otherwise, they leave it face up."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Revealer", description, winCondition, advanced)
}
export const Revealer = FRevealer()

const FExposer = () => {
  let description = "The Exposer may turn over one, two or three of the centre cards, chosen at random."
  let winCondition = ""
  let advanced = "If more than one Exposer is present and a card is picked twice, it will be flipped back down."
  return cardTemplate("Exposer", description, winCondition, advanced)
}
export const Exposer = FExposer()

const FEmpath = () => {
  let description = " The Empath goes at the end of the night. They learn the results of a poll. This poll can be given to everyone, odd numbered players, even numbered players, or specific individuals."
  let winCondition = ""
  let advanced = "The questions that the Empath can ask are:\n"
  lookup.EmpathQuestions.forEach(q => {
    advanced += "-Select " + q + "\n"
  })
  return cardTemplate("Empath", description, winCondition, advanced)
}
export const Empath = FEmpath()


const FCurator = () => {
  let description = "The Curator goes at the end of the night. They place down a random token, from a known pool of five, on any player's card. This token changes how that person plays and overrides their card."
  let winCondition = ""
  let advanced = "The tokens for the curator are:\n"
  

  for (const tokenname in lookup.tokens){
    if (tokenname !== "Shield" && tokenname !== "template"){
      advanced += "-" + lookup.tokens[tokenname].name + ": " + lookup.tokens[tokenname].description + "\n"
    }
  }
  advanced += "The Claw of the Werewolf and The Void of Nothingness are always included in the five choices."
  return cardTemplate("Curator", description, winCondition, advanced)
}
export const Curator = FCurator()

const FThe_Blob = () => {
  let description = "During the night, The Blob will discover who is part of The Blob"
  let winCondition = "They win if they manage to keep all members of The Blob alive."
  let advanced = `If the game has three players, the Blob only needs to keep themselves alive in order to win. 
If the game has four players, the Blob needs to keep themselves and one other player alive: either the one to their left, or the one to their right. 
If the game has five or six players, the Blob needs to keep themselves and two other players alive: either the two to their left, the two to their right, or one on either side. 
If the game has seven or eight players, the Blob needs to keep themselves and three other players alive: either the three to their left, or the three to their right. 
If the game has nine or more players, the Blob needs to keep themselves and four other players alive: either the four to their left, the four to their right, or two on either side.`
  return cardTemplate("The Blob", description, winCondition, advanced)
}
export const The_Blob = FThe_Blob()

const FMortician = () => {
  let description = "The Mortician looks at a card randomly, either of themselves of of either of their neighbours."
  let winCondition = "They win if either of their neighbours is lynched."
  let advanced = "The Mortician has an equal chance of looking at any of the three possible cards. If the game has five or more players, the Mortician views two of the three cards."
  return cardTemplate("Mortician", description, winCondition, advanced)
}
export const Mortician = FMortician()

const FVillager = () => {
  let description = "The Villager doesn't wake up during the night."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Villager", description, winCondition, advanced)
}
export const Villager = FVillager()

const FTanner = () => {
  let description = "The Tanner doesn't wake up during the night."
  let winCondition = "They win if they are lynched. Most other roles cannot win with the Tanner."
  let advanced = `If a Tanner is lynched, the Apprentice Tanner will also win. 
If a lynched Tanner has the Mark of the Assassin, the Assassin will also win.
If a lynched Tanner is a neighbour to a Mortician, the Mortician will also win. A Sly Fox can also win with the Tanner, as can the Prophet.`
  return cardTemplate("Tanner", description, winCondition, advanced)
}
export const Tanner = FTanner()

const FSly_Fox = () => {
  let description = "The Sly Fox doesn't wake up during the night."
  let winCondition = "They win if they receive 0 votes and are not killed. Most other roles cannot win with the Sly Fox."
  let advanced = `The Blob can win with the Sly Fox only if the Sly Fox is part of The Blob.
The Guardian Angel can win with the Sly Fox if they have the Fox as their target.
The Tanner, Apprentice Tanner, Assassin, Apprentice Assassin, Prophet and other Sly Foxes can also win with the Sly Fox.`
  return cardTemplate("Sly Fox", description, winCondition, advanced)
}
export const Sly_Fox = FSly_Fox()

const FHunter = () => {
  let description = "The Hunter doesn't wake up during the night. If they are killed, the player they voted for will be shot and killed."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Hunter", description, winCondition, advanced)
}
export const Hunter = FHunter()

const FDream_Wolf = () => {
  let description = "The Dream Wolf doesn't wake up during the night."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Dream Wolf", description, winCondition, advanced)
}
export const Dream_Wolf = FDream_Wolf()

const FPrince = () => {
  let description = "The Prince doesn't wake up during the night. They are immune to being lynched and, if they have the highest amount of votes, the player with the second highest amount of votes is lynched instead."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Prince", description, winCondition, advanced)
}
export const Prince = FPrince()

const FBodyguard = () => {
  let description = "The Bodyguard doesn't wake up during the night. The player they vote for at the end of the day is immune to being lynched and, if that player has the highest amount of votes, the player with the second highest amount of votes is lynched instead."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Bodyguard", description, winCondition, advanced)
}
export const Bodyguard = FBodyguard()

const FCursed = () => {
  let description = "The Cursed doesn't wake up during the night. If they are voted for by a werewolf, they transform into a werewolf and join Team Werewolf."
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Cursed", description, winCondition, advanced)
}
export const Cursed = FCursed()

const FTemplate = () => {
  let description = ""
  let winCondition = ""
  let advanced = ""
  return cardTemplate("Template", description, winCondition, advanced)
}
export const Template = FTemplate()







/*
0. Town
1. Neutrals
2. Werewolves

9. Town Chaos
10. Town Information
11. Town Blocking
12. Town Support
13. Town Explosive
14. Wolf Classic
15. Wolf Claws
16. Neutral Survivor
17. Neutral Killer
18. Random
*/

const FRTown = () => {
  let description = "Any random Town-aligned role."
  let winCondition = ""
  let advanced = "The roles in this category are: " + libs.Intersect(lookup.ProgrammedRoles.sublist["Town"]).join(", ")

  let card = cardTemplate("Random Town", description, winCondition, advanced)
  card.night = true
  card.passive = true
  //delete card.fileLoc
  return card
}
export const Random_Town = FRTown()

const FRNeutral = () => {
  let description = "Any random non-Town and non-Wolf aligned role."
  let winCondition = ""
  let advanced = "The roles in this category are: " + libs.Intersect(lookup.ProgrammedRoles.sublist["Neutrals"]).join(", ")

  let card = cardTemplate("Random Neutral", description, winCondition, advanced)
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Neutral = FRNeutral()

const FRWolf = () => {
  let description = "Any random Wolf-aligned role."
  let winCondition = ""
  let advanced = "The roles in this category are: " + libs.Intersect(lookup.ProgrammedRoles.sublist["Werewolves"]).join(", ")

  let card = cardTemplate("Random Wolf", description, winCondition, advanced)
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Wolf = FRWolf()

const FRTChaos = () => {
  let description = "The Town-aligned roles that move cards around or otherwise introduce an element of chaos into the game."
  let winCondition = ""

  let card = cardTemplate("Random Town Chaos", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Town_Chaos = FRTChaos()

const FRTInformation = () => {
  let description = "The Town-aligned roles that learn information to assist deciphering the chaos of the game."
  let winCondition = ""
  
  let card = cardTemplate("Random Town Information", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Town_Information = FRTInformation()

const FRTBlocking = () => {
  let description = "The Town-aligned roles that negate specific effects."
  let winCondition = ""

  let card = cardTemplate("Random Town Blocking", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = true
  //delete card.fileLoc
  return card
}
export const Random_Town_Blocking = FRTBlocking()

const FRTSupport = () => {
  let description = "The Town-aligned roles that revolve around co-operation with your towns-kin."
  let winCondition = ""

  let card = cardTemplate("Random Town Support", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = true
  //delete card.fileLoc
  return card
}
export const Random_Town_Support = FRTSupport()

const FRTExplosive = () => {
  let description = "The Town-aligned roles that are heavily unpredictable and may be able to change win conditions."
  let winCondition = ""

  let card = cardTemplate("Random Town Explosive", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = true
  //delete card.fileLoc
  return card
}
export const Random_Town_Explosive = FRTExplosive()

const FRWClassic = () => {
  let description = "The Wolf-aligned roles beneficial to have in every game."
  let winCondition = ""

  let card = cardTemplate("Random Wolf Classic", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Wolf_Classic = FRWClassic()

const FRWClaws = () => {
  let description = "The Wolf-aligned roles that you don't want in EVERY game."
  let winCondition = ""

  let card = cardTemplate("Random Wolf Claws", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Wolf_Claws = FRWClaws()

const FRNSurvivor = () => {
  let description = "The non-Town and non-Wolf aligned roles whose main objectives are survival."
  let winCondition = ""

  let card = cardTemplate("Random Neutral Survivor", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Neutral_Survivor = FRNSurvivor()

const FRNKiller = () => {
  let description = "The non-Town and non-Wolf aligned roles whose main objectives are death and killing."
  let winCondition = ""

  let card = cardTemplate("Random Neutral Killer", description, winCondition, "")

  card.advanced = "The roles in this category are: " + libs.joins(libs.Intersect(lookup.ProgrammedRoles.sublist[`${card.alliance} ${card.category}`], lookup.categories[card.alliance][card.category]))
  card.night = true
  card.passive = false
  //delete card.fileLoc
  return card
}
export const Random_Neutral_Killer = FRNKiller()

/*
  Town : {
    Chaos : new Set(["Doppelganger", "Troublemaker", "Drunk", "Witch", "Village Idiot", "Curator", "Copycat", "Pickpocket", "Gremlin", "Rascal", "Child"]),
    Information : new Set(["Mason", "Seer", "Robber", "Insomniac", "Apprentice Seer", "Revealer", "Marksman", "Psychic", "Exposer", "Beholder", "Petshop Owner"]),
    Blocking : new Set(["Sentinel", "Bodyguard", "Priest", "Prince"]),
    Support : new Set(["Villager", "Hunter", "Oracle", "Empath", "Aura Seer", "Thing", "Parity Sheriff", "Analyst"]),
    Explosive : new Set(["Diseased", "Instigator", "Cursed", "Paranormal Investigator", "Nostradamus"])
  },
  Wolf : {
    Classic : new Set(["Werewolf", "Alpha Wolf", "Dream Wolf", "Minion"]),
    Claws : new Set(["Squire", "Shaman Wolf", "Observer Wolf", "Mystic Wolf"]),
  },
  Neutral : {
    Survivor : new Set(["Tanner", "The Blob", "Prophet", "Guardian Angel", "Sly Fox"]),
    Killer : new Set(["Apprentice Assassin", "Assassin", "Apprentice Tanner", "Mortician"])
  },
  */
