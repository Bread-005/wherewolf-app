import * as lookup from "./Constants.js"
import * as libs from "./GameFunctions.js"
import * as DS from "./DataStructures.js"

const IMPLEMENTEDROLES = true
const ITERATIONS = 7000
const ROLEITERATION = 100
const THRESHHOLD = 0.95 // Percent error codes significant

export const ERRORCODES = {
  1 : "No roles added, generation error",
  2 : "Randoms overlooked, Generation error",
  3 : "Lone Mason. Add at least one more Mason to use random roles",
  4 : "If adding an Apprentice Tanner, add a Tanner too to use random roles",
  5 : "If adding an Apprentice Assassin, add an Assassin too to use random roles",
  6 : "If adding a Beholder, add a Seer too to use random roles",
  7 : "If adding a Child, add either a Seer, or a Drunk and a Witch or Exposer to use random roles",
  8 : "If adding a Priest, add either an Instagator, Assassin or Diseased instead to use random roles",
  9 : "If adding a Pickpocket, Marksman or Gremlin, add at least one of Instigator, Assassin, Diseased or Cupid to use random roles",
  10 : "If adding an Alpha Wolf with only three playes, add at least one of Robber, Drunk, Tanner or Witch to use random roles",
  11 : "If adding a Drunk, you should add at least one off Oracle, Seer, Apprentice Seer or Shaman Wolf to use random roles",
  12 : "If adding a Sentinel, add at least one of" + libs.joins(lookup.Lists.ChaosRoles) + " to use random roles",
  13 : "Wolves are too weak in this setup. Add stronger/more wolves or weaker/fewer town to use random roles",
  14 : "Wolves are too strong in this setup. Add stronger/more town or weaker/fewer wolves to use random roles"
}

export function reroll(roleslist, rollAll=true, rollUnrolled=true, Trueblind=false, nights=1, numPlayers=3, rollAnyway=false){
  // Returns a sorted array of roleEntry objects

  let roleslist2 = libs.ArrayToObject(roleslist, false, true)
  let numCards = (!numPlayers) ? 0 : Math.max(numPlayers+3, 6, roleslist2.length)
  
  while (roleslist2.length < numCards){
    roleslist2.push(DS.roleListEntry("Random Any", "Random Any", true))
  }
  libs.shuffleArray(roleslist2)
  

  if(rollAll && (!Trueblind || rollAnyway)){
    let newroleslist = addRoles(roleslist2, Trueblind, nights)

    return {roles : (!!newroleslist[0]) ? libs.sortRolelist(newroleslist) : [], errors : (!newroleslist[0]) ? newroleslist.slice(1) : []}//////////

  } else if (rollUnrolled && (!Trueblind || rollAnyway)){    
    let rolesrolling = []
    roleslist2 = roleslist2.map((r, z) => {
      r.id = z
      return r
    })
    //console.log(">>>", roleslist2, roleslist)
    let n = roleslist2.map((r, z) => {
      if(r.role.includes("Random ")){
        rolesrolling.push(z)
        return DS.roleListEntry(r.role, r.random, r.extra, z)
      }
      return DS.roleListEntry(r.role, r.role, r.extra, z)
    })

    n = addRoles(n, Trueblind || rollAnyway, nights)
    if (!n || !n[0]){return {roles : [], errors : n}}////////////////
    
    let newroleslist = roleslist2.map((r, i) => {
      if(rolesrolling.includes(r.id)){return n.filter(r2 => r2.id === r.id)[0]}
      return roleslist2.filter(r2 => r2.id === r.id)[0]
    })

    return {roles : (!!newroleslist[0]) ? libs.sortRolelist(newroleslist) : [], errors : (!newroleslist[0]) ? newroleslist.slice(1) : []} /////////
  }
  return {roles : (!!roleslist2[0]) ? libs.sortRolelist(roleslist2) : [], errors : (!roleslist2[0]) ? roleslist2.slice(1) : []}///////////
}


export function rollSingle(roleslist, index, blind, nights, numPlayers){
  let roleslist2 = libs.ArrayToObject(roleslist, false, true)

  if(!(index instanceof Array)){
    index = [index]
  }

  roleslist2 = roleslist2.map((r,i) => {
    if(index.includes(i)){
      return DS.roleListEntry(r.random, r.random, r.extra, i)
    }
    return DS.roleListEntry(r.role, r.role, r.extra, i)
  })
  

  let newroleslist = reroll(roleslist2, true, false, blind, nights, numPlayers, false)
  if(!!newroleslist.errors.length){
    return newroleslist
  }

  //console.log("Wolf power of original list", wolfPower(libs.ArrayToObject(roleslist, true), nights))
  index.forEach(i => {
    console.log("Replacing " + roleslist[i].role + " with", newroleslist.roles.filter(r => r.id === i)[0].role)
    roleslist[i] = newroleslist.roles.filter(r => r.id === i)[0]  
  })
  //console.log("Wolf power of new list", wolfPower(libs.ArrayToObject(roleslist, true), nights))
  
  return {roles : libs.sortRolelist(roleslist), errors : []}
}


// Clear rolled information
export function blindList(roleslist){
  let roleslist2 = libs.ArrayToObject(roleslist, false, true)
  return libs.sortRolelist(roleslist2.map(r => {DS.roleListEntry(r.random)}))
}

export function addRoles(roleslist, Trueblind=false, nights=1){

  let roleslist2 = libs.ArrayToObject(roleslist, false, true)

  let noOfRoles = roleslist2.length

  let {noOfRands, blind} = countRandoms(roleslist2, Trueblind)
  if (!noOfRands){return roleslist}
  

  let newroleslist = {}
  let k = 0
  let valid = false
  let errorCodes = {}
  do {
    let {allWeights, allLimits} = makeweights(noOfRoles, blind, nights)
    newroleslist = replaceRandom(roleslist2, allWeights, allLimits, blind, noOfRoles)
    k ++
    let newErrorCodes = isValid(newroleslist, nights)
    valid = !newErrorCodes.length
    newErrorCodes.forEach(code => {
      errorCodes[code] = errorCodes[code] ? errorCodes[code]+1 : 1
    })
  } while (!valid && k < ITERATIONS)
  
  if(!valid){
    let c = 0
    let t = 0
    for (const [code, count] of Object.entries(errorCodes)){
      c += count
      t ++
    }
    let bar = c/t * THRESHHOLD
    let significant = [false]
    for (const [code, count] of Object.entries(errorCodes)){
      if (count >= bar){
        significant.push(ERRORCODES[code])
      }
    }

    console.log("Failed validation for new roles, k="+ k, newroleslist, errorCodes, significant)
    return significant
  }

  //console.log("Replaced Roles, k="+ k, newroleslist.map(r => {return libs.roletext(r, false)}))
  return newroleslist
}


function replaceRandom(roleslist, allWeights, allLimits, blind, noOfRoles){ 

  let failed = false
  let newroleslist = libs.sortRolelist(roleslist, true)

  let temproleslist = []
  newroleslist.forEach((ranObj, i) => {
    let ran = ""
    if(!ranObj.random.includes("Random ")){
      ran = ""
      addOne(temproleslist, ranObj.role, allWeights, allLimits, blind, noOfRoles, true)
      temproleslist.push(ranObj)
    } else {
      ran = ranObj.random.replace("Random ", "")
    }
    
    if (!!ran){
      let list = new Array
      if(ran.includes(" ")){
        let temp = ran.split(" ")
        list = lookup.categories[temp[0]][temp[1]]
      }else if (ran === "Any"){
        list = lookup.AllRoles
      }else{
        let n = Object.keys(lookup.categories).indexOf(ran) //change wolf into werewolves
        let s = (n <= 2 && n !== -1) ? lookup.Faction.getters2[n] : ran
        list = Array.from(lookup.Faction[s])
      }
      
      let newWeights = filterWeights(allWeights, list)
      let newRole = ""
      let k = 0

      let totalWeight = 0
      for (const [role, count] of Object.entries(weights)){totalWeight += count}

      do{
        // @ts-ignore
        newRole = pickItem(newWeights, totalWeight)
        newRole = addOne(newroleslist, newRole, allWeights, allLimits, blind, noOfRoles)
        k ++
      } while (!newRole && k < ROLEITERATION)
      newroleslist[i].role = newRole

      failed = failed || !newRole
    }
  })
  return failed ? false : newroleslist
}

function addOne(roleslist, newRole, allWeights, allLimits, blind, noOfRoles, nonRand=false){

  let rolesCount = libs.ArrayToObject(roleslist, true, false)
  
  if(newRole in allLimits && !nonRand){
    if (rolesCount[newRole] >= allLimits[newRole]){
      return false
    } else if(rolesCount[newRole]+1 === allLimits[newRole]){
      // If limit reached, make weight 0
      allWeights[newRole] = 0
    }
  }

  // If there are lots of chaos roles, decrease the probability of chaos roles. If fewer than 1/3 roles are chaos, increase chaos probability
  // If there are fewer wolves, increase the probability of wolves
  // Once there are enough wolves/chaos roles, reduce the probability back to the original weights
  let chaosCount = 0
  let chaosMult = 1
  let wolfCount = 0
  let wolfMult = 1
  for( const [key, value] of Object.entries(rolesCount)){
    if(lookup.Lists.ChaosRoles.includes(key)){
      chaosCount += value
    }
    if(lookup.Lists.MeetingWolves.includes(key)){
      wolfCount += value
    }
  }
  if (chaosCount*3 < noOfRoles){
    chaosMult = 1.1
  } else if (chaosCount*3 > noOfRoles){
    chaosMult = 0.9
  }
  if (wolfCount*3 < noOfRoles){
    chaosMult = 1.1
  } else if (chaosCount*3 > noOfRoles){
    chaosMult = 0.9
  }

  lookup.Lists.MeetingWolves.forEach(wolf => {allWeights[wolf] *= wolfMult})
  lookup.Lists.ChaosRoles.forEach(chaos => {allWeights[chaos] *= chaosMult})


  lookup.Lists.linkedRoles.forEach(rs => {
    if(rs[0] === newRole && rs[1] in allWeights && !(rs[1] in rolesCount)){
      allWeights[rs[1]] *= 1.1 
    }
  })
  
  let limit = true
  if(lookup.Lists.doubledRoles.includes(newRole)){
    if(!(newRole in rolesCount)){
      // Guarantee a second Mason
      allWeights[newRole] *= 100
      limit = false
    } else if (allWeights[newRole] > 10){
      allWeights[newRole] /= 100
    }
  }

  // After a role has been chosen, cap it's probability at 2
  if (limit && allWeights[newRole] > 2){
    allWeights[newRole] = 2
  }
  
  // After a role is picked, reduce it's probability
  allWeights[newRole] /= 1.2

  // If the weight is less than 0, reset to 0
  allWeights[newRole] = (allWeights[newRole] < 0) ? 0 : allWeights[newRole]
  
  if (newRole === "Normal Analyst"){
    let x = Math.floor(Math.random()*4)
    if(blind > 0.5){
      x = Math.floor(Math.random()*3)
    }
    if (x===0 && !("Normal Analyst" in rolesCount)){
      newRole = "Normal Analyst"
    } else{
      newRole = "Any Analyst"
    }
  }
  
  return newRole
}

function filterWeights(weights, filtrate){
  let obj = {}
  for(const [key, value] of Object.entries(weights)){
    if((filtrate instanceof Set && filtrate.has(key)) || (filtrate instanceof Array && filtrate.includes(key))){
      obj[key] = value
    }
  }
  return obj
}

function countRandoms(roleslist, Trueblind){

// put the randoms in order from smallest group to largest group
  let randomsToAdd = new Array
  for (let j = 0; j<roleslist.length; j++){
    if (!roleslist[j].extra && roleslist[j].random.includes("Random ")){
      randomsToAdd.push(roleslist[j].random.replace("Random ", ""))
    }
  }

  let blind = Trueblind ? calcBlind(randomsToAdd, roleslist.length) : 0

  return {noOfRands : randomsToAdd.length, blind}
}

function calcBlind(randomsToAdd, noOfRoles){
  let blind = 0
  randomsToAdd.forEach(r => {
    switch (r){
      case "Any":
        blind += 1
        break
      case "Town":
        blind += 0.88
        break
      case "Wolf":
        blind += 0.7
        break
      case "Neutral":
        blind += 0.6
        break
      default:
        blind += 0.4 
    }
  })
  
  blind /= noOfRoles
  return blind
}

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
*/

function makeweights(noOfRoles, blind, nights){
  let allWeights = {}
  let allLimits = {}

  let rolesUsed = IMPLEMENTEDROLES ? lookup.ProgrammedRoles.allRolesList : lookup.AllRoles  // Use this when want to limit the roles to only implemented
  
  rolesUsed.forEach(r => {               
    if (r in weights){
      allWeights[r] = weights[r]
    } else {
      allWeights[r] = 1.0
    }
    if (r in Limits){
      allLimits[r] = Limits[r]
    }
  })
  
  let weightednum =  (noOfRoles in WeightedGames) ? noOfRoles : Object.keys(WeightedGames).slice(-1)
  for (const [role, weight] of Object.entries(WeightedGames[weightednum])){
    if(rolesUsed.includes(role)){
      allWeights[role] = weight
    }
  }
  
  if (blind >= 0.5){
    for (const [role, weight] of Object.entries(BlindInfoRoles)){
      if (rolesUsed.includes(role)){
        // p + o*(q-p)
        allWeights[role] = allWeights[role] + blind*(allWeights[role] * weight-allWeights[role])
        allWeights[role] = (allWeights[role] < 0) ? 0 : allWeights[role]
      }
    }
    for (const [role, count] of Object.entries(BlindLimits)){
      if (rolesUsed.includes(role)){
        allLimits[role] = count
      }
    }
  }
  
  /*
  Object.defineProperty(allWeights, "count", {
    get() {
      let t = 0
      for (const [role, count] of Object.entries(this)){t += count}
      return t
    }
  })
  */
  return {allWeights, allLimits}
}

// @ts-ignore
function pickItem(weights, totalWeight){

  let v = Math.random() * totalWeight
  for (const [role, count] of Object.entries(weights)){
    v -= count
    if (v<=0){
      return role
    }
  }
  //return weights[Object.keys(weights).slice(-1)[0]]
}

function isValid(roleslist, nights){
  let errorCodes = []

  if (!roleslist){
    errorCodes.push(1)
    return errorCodes
  } // No roles added

  let {noOfRands, blind} = countRandoms(roleslist)
  if (!noOfRands){
    errorCodes.push(2)
    return errorCodes
  } // Still randoms to add

  const NoOfPeople = roleslist.length-3

  let fail = false
  // If there are only one masons
  lookup.Lists.doubledRoles.forEach(Mason => {
    let n = roleslist.map(r => {return r.role === Mason}).length
    fail = fail || (n === 1)
  })
  if(fail){errorCodes.push(3)} //Lone mason
  let rolescount = libs.ArrayToObject(roleslist, true)

  let wolfCount = roleslist.filter(r => lookup.Faction.Werewolves.has(r.role)).length
    
  for (let i = 0; i < roleslist.length; i++){
    let role = roleslist[i].role
    if (roleslist[i].random.includes("Random ")){

      if (role === "Apprentice Tanner" && !("Tanner" in rolescount)) {
        errorCodes.push(4) // Need a tanner
      } else if (role === "Apprentice Assassin" && (!("Assassin" in rolescount) || NoOfPeople <= 3)) {
        errorCodes.push(5) // Need an assassin
      } else if (role === "Beholder" && !("Seer" in rolescount)) {
        errorCodes.push(6) // Need a seer
      } else if (role === "Child" && (!("Seer" in rolescount) || ((!("Drunk" in rolescount)) && !("Witch" in rolescount) && !("Exposer" in rolescount)))) {
        errorCodes.push(7) // if child, need a seer and a drunk
      } else if (role === "Priest" && (!("Instigator" in rolescount) && !("Assassin" in rolescount) && !("Diseased" in rolescount))) {
        errorCodes.push(8) // if priest, need instigator, assassin or diseased
      } else if (["Pickpocket", "Marksman", "Gremlin"].includes(role) && (!("Instigator" in rolescount) && !("Assassin" in rolescount) && !("Diseased" in rolescount) && !("Cupid" in rolescount))) {
        errorCodes.push(9) // if pickpocket, marksman or gremlin, need instigator, assassin, diseased or cupid
      } else if (role === "Alpha Wolf" && NoOfPeople === 3 && (!("Robber" in rolescount) && !("Drunk" in rolescount) && !("Tanner" in rolescount) && !("Witch" in rolescount))) {
        errorCodes.push(10) // if alpha wolf and three people, need robber, drunk, tanner or witch
      } else if (wolfCount > NoOfPeople/2 && (!("Robber" in rolescount) && !("Drunk" in rolescount) && !("Tanner" in rolescount) && !("Witch" in rolescount))) {
        errorCodes.push(14)
      } else if (role === "Drunk" && (!("Oracle" in rolescount) && !("Seer" in rolescount) && !("Apprentice Seer" in rolescount) && !("Shaman Wolf" in rolescount))) {
        if (Math.random() < 0.5) {
          errorCodes.push(11) // if drunk, need oracle, seer, apprentice seer or shaman
        }
      } else if (role === "Sentinel" && !Object.keys(rolescount).filter(role => lookup.Lists.ChaosRoles.includes(role)).length) {
        errorCodes.push(12) // if sentinel, need a chaos role
      }
    }
  }

  let counter = wolfPower(rolescount, nights)

  if (counter < 1) {
    errorCodes.push(13)
  } else if (NoOfPeople === 3 && (counter >= 2.8)) {
    errorCodes.push(14)
  } else if (NoOfPeople === 3 && (counter <= 1)) {
    errorCodes.push(13)
    
  } else if (NoOfPeople <= 4 && (counter >= 3.5)) {
    errorCodes.push(14)
  } else if (NoOfPeople <= 4 && (counter <= 2)) {
    errorCodes.push(13)

  } else if ((NoOfPeople === 5 || NoOfPeople === 6) && (counter >= 5)) {
    errorCodes.push(14)
  } else if ((NoOfPeople === 5 || NoOfPeople === 6) && (counter <= 2.5)) {
    errorCodes.push(13)

  } else if ((NoOfPeople >= 7) && (counter >= 6)) {
    errorCodes.push(14)
  } else if ((NoOfPeople >= 7) && (counter <= 3)) {
    errorCodes.push(13)
  }
  
  return errorCodes
}

export function wolfPower(roleslist, nights){

  let WolfAdd = 0
  for (const [role, count] of Object.entries(roleslist)){
    if (lookup.Lists.MeetingWolves.includes(role)){WolfAdd += count}
  }

  let counter = 0
  for (const [role, count] of Object.entries(roleslist)){
    if (role === "Alpha Wolf") {
      counter += 2 * count
    } else if (role === "Mystic Wolf") {
      counter += 1.5 * count
    } else if (role === "Dream Wolf") {
      counter += 0.5 * count
    } else if (role === "Cursed") {
      counter += 0.25 * count
    } else if (role === "Village Idiot") {
      counter -= 0.5 * count
    } else if (role === "Shaman Wolf" && "Alpha Wolf" in roleslist) {
      counter += 1.5 * count
    } else if (role === "Minion" && WolfAdd > 2) {
      counter += 1 * count
    } else if (role === "Minion") {
      counter += 0.5 * count
    } else if (role === "Squire" && WolfAdd > 2) {
      counter += 1 * count
    } else if (role === "Squire") {
      counter += 1 * count
    } else if (role === "Prince") {
      counter -= 0.25 * count
    } else if (role === "Seer") {
      counter -= 0.5 * count
    } else if (role === "Revealer") {
      counter -= 1 * count
    } else if (role === "Petshop Owner") {
      counter -= 0.25 * count
    } else if (role === "Paranormal Investigator") {
      if (WolfAdd === 1) {
        counter -= 0.75 * count
      } else {
        counter += 0.25 * count
      }
    } else if (role === "Copycat") {
      counter += 0.25 * count
    } else if (role === "Bodyguard") {
      counter -= 0.1 * count
    } else if (["Assassin", "Apprentice Assassin", "Tanner"].includes(role)) {
      counter += 0.25 * count
    } else if (lookup.Lists.MeetingWolves.includes(role)) {
      counter += 1 * count
    } else if (role === "Robber") {
      counter -= 0.35 * count
    } else if (role === "Instigator") {
      if (WolfAdd === 1) {
        counter += 0.3 * count
      } else if (WolfAdd >= 2) {
        counter += 0.1 * count
      }
    } else if (role === "Hunter") {
      counter -= 0.25 * count
    } else if (role === "Psychic") {
      if (roleslist.includes("Mystic Wolf")) {
        counter += 0.2 * count
      } else {
        counter -= 0.4 * count
      }
    }

  }

  if (nights > 2){
    counter *= Math.pow(0.9, nights)
  }

  return counter
}



const weights = {
        "Villager": 0.3,
        "Mason" : 0.7,
        "Robber" : 1.2,
        "Troublemaker" : 1.3,
        "Seer" : 1.3,
        "Werewolf" : 1.3,
        "Dream Wolf" : 1.1,
        "Alpha Wolf" : 0.7,
        "Mystic Wolf" : 0.7,
        "Tanner" : 0.6,
        "Apprentice Tanner" : 0.7,
        "Doppelganger" : 0.9,
        "Revealer" : 0.7,
        "Normal Analyst" : 1.2, //special clauses for analysts
        "Insane Analyst" : 0,
        "Paranoid Analyst" : 0,
        "Confused Analyst" : 0,
        "Beholder" : 1.1,
        "Sentinel" : 0.8,
        "Sly Fox" : 0.7,
        "Shaman Wolf" : 0.8,
        "Curator" : 0.3,
        "Instigator" : 0.6,
        "Priest" : 0.4,
        "Exposer" : 0.7,
        "Copycat" : 0.9,
        "Empath" : 0.7
        }
        
        
const Limits = {
        "Alpha Wolf" : 2,
        "Tanner" : 1,
        "Assassin" : 1,
        "Apprentice Assassin" : 1,
        "Mason" : 3,
        "Revealer" : 1,
        "Village Idiot" : 1,
        "Sly Fox" : 1,
        "Curator" : 1,
        "Priest" : 1,
        "Exposer" : 1,
        "Bodyguard" : 1,
        "Copycat" : 1,
        "Empath" : 1,
        "Doppelganger" : 2,
        }
    
const BlindInfoRoles = {
        "Exposer" : 3,
        "Seer" : 5,
        "Robber" : 1.7,
        "Mystic Wolf" : 1.4,
        "Mason" : 3,
        "Normal Analyst" : 1.8,
        "Alpha Wolf" : 1.6,
        "Witch" : 1.5,
        "Revealer" : 1.8,
        "Mortician" : 1.5,
        "Parity Sheriff" : 2,
        "Doppelganger" : 1.5,
        "Paranormal Investigator" : 2,
        "Observer Wolf" : 1.9,
        "Apprentice Seer" : 1.8,
        "Beholder" : 10,
        "Insomniac" : 1.6,
        "Werewolf" : 1.5,
        "Dream Wolf" : 0.4,
        "Apprentice Assassin" : 10,
        "Apprentice Tanner" : 10,
        "Assassin" : 2,
        "Tanner" : 0.6,
        "Drunk" : 0.2,
        "Minion" : 2,
        "Villager" : 0,
        "Petshop Owner" : 1,
        "Thing" : 0.5,
        "Shaman Wolf" : 0.4
        }

const BlindLimits = {
        "Apprentice Assassin" : 1,
        "Apprentice Tanner" : 1,
        "Alpha Wolf" : 1,
        "Seer" : 3,
        "Dream Wolf" : 1,
        "Mason" : 4,
        "Revealer" : 2,
        "Village Idiot" : 1,
        "Beholder" : 2,
        "Minion" : 2,
        "Drunk" : 1,
        "Exposer" : 2
        }
    
const MoreNights = {
        "Normal Analyst" : 2.1,
        "Minion" : 1.6,
        "Apprentice Seer" : 1.2,
        "Seer" : 0.8,
        "Dream Wolf" : 1.1,
        "Mystic Wolf" : 1.1,
        "Shaman Wolf" : 1.3,
        "Mason" : 1.6,
        "Squire" : 1.4
    }

const WeightedGames = {
        6 : {
            "Mason" : 0.5,
            "Paranormal Investigator" : 0.5,
            "Bodyguard" : 0.4,
            "Alpha Wolf" : 0.2,
            "Sentinel" : 0.6,
            "Prince" : 0.5,
            "Cupid" : 0,
            "Revealer" : 0.1,
            "Mortician" : 0,
            "Apprentice Tanner" : 0.5,
            "Apprentice Assassin" : 0.8,
            "Parity Sheriff" : 0.5,
            "Normal Analyst" : 1.2,
            "Sly Fox": 0.5,
            "Tanner" : 0.4,
            "Prophet" : 0.7,
            "Guardian Angel" : 0.7,
            "Petshop Owner" : 0,
            "Priest" : 0,
            "Instigator": 0.4,
            "Exposer" : 0.1,
            "Cursed" : 0.4,
            "Empath" : 0.2,
            "Thing" : 0,
            "Squire" : 0
            },
        7 : {
            "Mason" : 0.7,
            "Bodyguard" : 0.8,
            "Alpha Wolf" : 0.7,
            "Cupid" : 0.6,
            "Revealer" : 0.4,
            "Mortician" : 0.5,
            "Apprentice Tanner" : 0.5,
            "Apprentice Assassin" : 0.5,
            "Normal Analyst" : 1.1,
            "Sly Fox" : 0.6,
            "Tanner" : 0.6,
            "Prophet" : 0.8,
            "Guardian Angel" : 0.8,
            "Curator" : 0.5,
            "Petshop Owner" : 0.5,
            "Exposer" : 0.4,
            "Empath" : 0.4,
            "Thing" : 0.4,
            "Squire" : 0.2
            },
        8 : {
            "Bodyguard" : 1,
            "Alpha Wolf" : 1.5,
            "Cupid" : 1.1,
            "Revealer" : 1,
            "Mortician" : 1.2,
            "Apprentice Tanner" : 2,
            "Apprentice Assassin" : 2,
            "Tanner" : 1.1,
            "Beholder" : 2,
            "Shaman Wolf" : 1.2,
            "Mason" : 1,
            "Curator" : 1,
            "Exposer" : 0.8
            }
        }






const Setups = {
        6 : [
              [
               "Werewolf",
               "Werewolf",
               "Robber",
               "Troublemaker",
               "Seer",
               "Villager"
              ],  // The standard setup
              [
               "Robber",
               "Minion",
               "Doppelganger",
               "Alpha Wolf",
               "Mystic Wolf",
               "Witch"
              ],  // From onenightultimate.com
              [
               "Robber",
               "Tanner",
               "Doppelganger",
               "Alpha Wolf",
               "Witch",
               "Dream Wolf"
              ],  // From onenightultimate.com
              [
               "Werewolf",
               "Alpha Wolf",
               "Seer",
               "Witch",
               "Drunk",
               "Drunk"
              ],  // Added by Timizorzom, 12/8/2020
              [
               "Oracle",
               "Werewolf",
               "Dream Wolf",
               "Robber",
               "Drunk",
               "Tanner"
              ],  // Added by Timizorzom, 5/9/2020
          ],
        7 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager"
              ],  // The standard setup
              [
               "Alpha Wolf",
               "Drunk",
               "Drunk",
               "Troublemaker",
               "Witch",
               "Doppelganger",
               "Seer"
              ],  // Added by Timizorzom 9/9/2020
              ["Werewolf",
               "Dream Wolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Insomniac",
               "Witch" 
              ],  // Added by Mint 20/9/20
              ["Oracle",
               "Werewolf",
               "Mystic Wolf",
               "Seer",
               "Troublemaker",
               "Mortician",
               "Doppelganger"
              ],  // Added by Cat for getting more than 10 votes with Observer 9/2/21
              ["Werewolf",
               "Alpha Wolf",
               "Robber",
               "Tanner",
               "Doppelganger",
               "Witch",
               "Curator"
               ],  // From onenightultimate.com
              ["Robber",
               "Troublemaker",
               "Doppelganger",
               "Alpha Wolf",
               "Witch",
               "Village Idiot",
               "Curator" // From onenightultimate.com
               ]
          ],
        8 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager",
               "Drunk"
              ],  // The standard setup
              [
               "Werewolf",
               "Werewolf",
               "Troublemaker",
               "Robber",
               "Witch",
               "Insomniac",
               "Drunk",
               "Seer"
              ],  // Added by Mint, 21/8/2020 (<@!357262949020073985>)
              [
               "Werewolf",
               "Seer",
               "Insomniac",
               "Mystic Wolf",
               "Apprentice Seer",
               "Paranormal Investigator",
               "Witch",
               "Revealer"
              ],  // From onenightultimate.com
              [
               "Seer",
               "Troublemaker",
               "Tanner",
               "Insomniac",
               "Alpha Wolf",
               "Mystic Wolf",
               "Paranormal Investigator",
               "Witch"
              ],  // From onenightultimate.com
              [
               "Werewolf",
               "Dream Wolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Insomniac",
               "Witch",
               "Doppelganger" 
               ],  // Added by Mint 20/9/20
              [
               "Prophet",
               "Werewolf",
               "Seer",
               "Robber",
               "Witch",
               "Troublemaker",
               "Sly Fox",
               "Dream Wolf"
              ], // Added  by Mint 12/05/21
               [
               "Alpha Wolf", 
               "Mystic Wolf", 
               "Dream Wolf", 
               "Robber",
               "Witch",
               "Village Idiot",
               "Aura Seer",
               "Cursed"
                  ] // From onenightultimate.com    #Aura Seer
          ],
        9 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager",
               "Drunk",
               "Insomniac"
              ],  // The standard setup
              [
               "Werewolf",
               "Werewolf",
               "Villager",
               "Seer",
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Minion"
              ],  // From onenightultimate.com
              [
               "Werewolf",
               "Werewolf",
               "Villager",
               "Villager",
               "Villager",
               "Tanner",
               "Mason",
               "Mason",
               "Doppelganger"
              ],  // From onenightultimate.com
              [
               "Robber",
               "Troublemaker",
               "Tanner",
               "Minion",
               "Doppelganger",
               "Mystic Wolf",
               "Paranormal Investigator",
               "Witch",
               "Dream Wolf"
              ],  // From onenightultimate.com
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Minion",
               "Doppelganger",
               "Witch",
               "Revealer"
              ],  // From onenightultimate.com
          ],
        10 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager",
               "Drunk",
               "Insomniac",
               "Alpha Wolf"
              ],  // The standard setup
              [
               "Werewolf",
               "Werewolf",
               "Villager",
               "Villager",
               "Seer",
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Minion"
              ],  // From onenightultimate.com
              [
               "Werewolf",
               "Werewolf",
               "Robber",
               "Witch",
               "Troublemaker",
               "Minion",
               "Paranormal Investigator",
               "Assassin",
               "Seer",
               "Insomniac"
              ],  // Added by Mint, 21/8/2020 (<@!357262949020073985>)
              [
               "Robber",
               "Tanner",
               "Drunk",
               "Minion",
               "Alpha Wolf",
               "Apprentice Seer",
               "Paranormal Investigator",
               "Witch",
               "Revealer",
               "Dream Wolf"
              ],  // From onenightultimate.com
          ],
        11 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager",
               "Drunk",
               "Insomniac",
               "Alpha Wolf",
               "Hunter"
              ],  // The standard setup
              [
               "Werewolf",
               "Werewolf",
               "Villager",
               "Villager",
               "Seer",
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Hunter",
               "Minion"
              ],  // From onenightultimate.com
              [
               "Werewolf",
               "Werewolf",
               "Doppelganger",
               "Robber",
               "Witch",
               "Troublemaker",
               "Minion",
               "Paranormal Investigator",
               "Assassin",
               "Seer",
               "Insomniac"
              ],  // Added by Lemon, 21/8/2020 (<@!553278770262441984>)
          ],
        12 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager",
               "Drunk",
               "Insomniac",
               "Alpha Wolf",
               "Hunter",
               "Tanner"
              ],  // The standard setup
              [
               "Werewolf",
               "Werewolf",
               "Villager",
               "Villager",
               "Villager",
               "Seer",
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Hunter",
               "Minion"
              ],  // From onenightultimate.com
              [
               "Robber",
               "Troublemaker",
               "Tanner",
               "Minion",
               "Doppelganger",
               "Alpha Wolf",
               "Mystic Wolf",
               "Apprentice Seer",
               "Witch",
               "Revealer",
               "Bodyguard",
               "Aura Seer"
              ], // From onenightultimate.com                     #Aura Seer
              [
               "Seer",
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Mason",
               "Mason",
               "Minion",
               "Doppelganger",
               "Alpha Wolf",
               "Mystic Wolf",
               "Witch"
              ],  // From onenightultimate.com
          ],
        13 : [
              [
               "Werewolf",
               "Werewolf",
               "Seer",
               "Robber",
               "Troublemaker",
               "Villager",
               "Villager",
               "Drunk",
               "Insomniac",
               "Alpha Wolf",
               "Hunter",
               "Tanner",
               "Doppelganger"
              ],  // The standard setup
              [
               "Werewolf",
               "Werewolf",
               "Villager",
               "Villager",
               "Seer",
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Hunter",
               "Minion",
               "Mason",
               "Mason"
              ],  // From onenightultimate.com
              [
               "Robber",
               "Troublemaker",
               "Drunk",
               "Hunter",
               "Minion",
               "Doppelganger",
               "Alpha Wolf",
               "Mystic Wolf",
               "Apprentice Seer",
               "Paranormal Investigator",
               "Witch",
               "Cursed",
               "Prince"
              ], // From onenightultimate.com
              [
               "Robber",
               "Troublemaker",
               "Tanner",
               "Drunk",
               "Hunter",
               "Minion",
               "Alpha Wolf",
               "Doppelganger",
               "Dream Wolf",
               "Paranormal Investigator",
               "Bodyguard",
               "Cursed",
               "Prince"
              ] // From onenightultimate.com
          ]
}
