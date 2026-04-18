import * as libs from "./GameFunctions.js"
import * as roles from "./roles.js"
import * as roleCards from "./Rolecards.js"

export const Faction = {
  UltimateTown : new Set([
    "Doppelganger",
    "Mason",
    "Seer",
    "Robber",
    "Troublemaker",
    "Drunk",
    "Insomniac",
    "Villager",
    "Hunter"
  ]),
  UltimateNeutral : new Set(["Tanner"]),
  UltimateWerewolves : new Set(["Werewolf", "Minion"]),

  DaybreakTown : new Set([
    "Sentinel",
    "Apprentice Seer",
    "Paranormal Investigator",
    "Witch",
    "Village Idiot",
    "Revealer",
    "Curator",
    "Bodyguard"
  ]),
  DaybreakNeutral : new Set([]),
  DaybreakWerewolves : new Set(["Alpha Wolf", "Mystic Wolf", "Dream Wolf"]),

  VampireTown : new Set([
    "Copycat",
    "Diseased",
    "Cupid",
    "Instigator",
    "Priest",
    "Marksman",
    "Pickpocket",
    "Gremlin"
  ]),
  VampireNeutral : new Set(["Renfield", "Assassin", "Apprentice Assassin"]),
  VampireVampires : new Set(["Vampire", "Count", "Master"]),

  AlienTown : new Set(["Oracle", "Cow", "Psychic", "Leader", "Rascal", "Exposer"]),
  AlienNeutral : new Set(["Synthetic", "Mortician", "The Blob"]),
  AlienAliens : new Set(["Alien", "Groob", "Zerb"]),

  ExpansionTown : new Set([
    "Cursed",
    "Prince",
    "Empath",
    "Beholder",
    "Aura Seer",
    "Nostradamus",
    "Thing"
  ]),
  ExpansionNeutral : new Set(["Apprentice Tanner"]),
  ExpansionWolves : new Set(["Squire"]),
  ExpansionAliens : new Set(["Bodysnatcher"]),

  InventedTown : new Set([
    "Parity Sheriff",
    "Rational Analyst",
    "Insane Analyst",
    "Paranoid Analyst",
    "Confused Analyst",
    "Analyst",
    "Child",
    "Petshop Owner"
  ]),
  InventedNeutral : new Set([
    "Sly Fox",
    "Prophet",
    "Guardian Angel"
  ]),
  InventedWolves : new Set([
    "Shaman Wolf",
    "Observer Wolf"
  ]),

  get Town(){
    return libs.Union(this.UltimateTown, this.DaybreakTown, this.VampireTown, this.AlienTown, this.ExpansionTown, this.InventedTown)
  },
  get Neutrals(){
    return libs.Union(this.UltimateNeutral, this.DaybreakNeutral, this.VampireNeutral, this.AlienNeutral, this.ExpansionNeutral, this.InventedNeutral)
  },
  get Werewolves(){
    return libs.Union(this.UltimateWerewolves, this.DaybreakWerewolves, this.ExpansionWolves, this.InventedWolves)
  },
  get Ultimate(){
    return libs.Union(this.UltimateTown, this.UltimateNeutral, this.UltimateWerewolves)
  },
  get Daybreak(){
    return libs.Union(this.DaybreakNeutral, this.DaybreakTown, this.DaybreakWerewolves)
  },
  get Vampire(){
    return libs.Union(this.VampireNeutral, this.VampireTown)
  },
  get Alien(){
    return libs.Union(this.AlienNeutral, this.AlienTown)
  },
  get Expansion(){
    return libs.Union(this.ExpansionNeutral, this.ExpansionTown, this.ExpansionWolves)
  },
  get Invented(){
    return libs.Union(this.InventedNeutral, this.InventedTown, this.InventedWolves)
  },
  getters2 : ["Town", "Werewolves", "Neutrals", "Ultimate", "Daybreak", "Vampire", "Alien", "Expansion", "Invented"],
  _getters : new Array,
  get getters (){
    if(!!Object.keys(this._getters).length){
      return this._getters
    }
    let base = [...this.getters2]
    Object.keys(categories).forEach(group => {
      Object.keys(categories[group]).forEach(category => {
        base.push(group + " " + category)
      })
    })
    base.push("Random")
    base.push("All")
    this._getters = base
    return this._getters
  }
}

export const categories = {
  Town : {
    Chaos : new Set(["Doppelganger", "Troublemaker", "Drunk", "Witch", "Village Idiot", "Copycat", "Pickpocket", "Gremlin", "Rascal", "Child"]),
    Information : new Set(["Mason", "Seer", "Robber", "Insomniac", "Apprentice Seer", "Revealer", "Marksman", "Psychic", "Exposer", "Beholder", "Petshop Owner"]),
    Blocking : new Set(["Sentinel", "Bodyguard", "Priest", "Prince"]),
    Support : new Set(["Villager", "Hunter", "Oracle", "Empath", "Aura Seer", "Thing", "Parity Sheriff", "Analyst"]),
    Explosive : new Set(["Diseased", "Instigator", "Cursed", "Paranormal Investigator", "Nostradamus", "Curator"])
  },
  Wolf : {
    Classic : new Set(["Werewolf", "Alpha Wolf", "Dream Wolf", "Minion"]),
    Claws : new Set(["Squire", "Shaman Wolf", "Observer Wolf", "Mystic Wolf"]),
  },
  Neutral : {
    Survivor : new Set(["The Blob", "Prophet", "Guardian Angel", "Sly Fox"]),
    Killer : new Set(["Apprentice Assassin", "Assassin", "Apprentice Tanner", "Mortician", "Tanner"])
  },
  
  find(name){
    let n = new Array(2)
    Object.keys(this).forEach(alliance => {
      if (typeof this[alliance] !== "function"){
        Object.keys(this[alliance]).forEach(category => {
          if (this[alliance][category].has(name)){
            n = [alliance, category]
          }
        })
      }
    })
    return n
  }
}


export const Lists = {
  MeetingWolves : ["Werewolf", "Alpha Wolf", "Mystic Wolf", "Dream Wolf", "Cursed Wolf", "Shaman Wolf", "Observer Wolf"], // Add wolves here
  Minions : ["Squire", "Minion"],
  doubledRoles : ["Mason"], //If there is one, guarantee at least one more
  linkedRoles : [["Mystic Wolf", "Psychic"], ["Psychic", "Mystic Wolf"], ["Mason", "Mason"], ["Apprentice Assassin", "Assassin"]], //If there is the first and not the second, slightly increase the probability of the second, permanently
  ChaosRoles : ["Village Idiot", "Witch", "Robber", "Troublemaker", "Gremlin", "Drunk"], // Roles that foil wolves and town
  //tr : ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"],
  PubliclySpeaking : ["The Blob", "Curator", "Mortician"],
}

export const allPhases = {
  none : new Set(["Villager", "Dream Wolf", "Tanner", "Sly Fox"]),
  n0 : new Set(["Doppelganger", "Copycat", "Empath", "Oracle", "Prophet"]),
  n1 : new Set(["Doppelganger", "Copycat", "Sentinel"]),
  n2 : new Set(["Doppelganger", "Copycat", "Diseased", "Cupid", "Instigator", "Priest", "Assassin", "Apprentice Assassin", "Apprentice Tanner", "Seer", "Werewolf"]), // all mark roles
  n3 : new Set(["Mason", "Seer", "Robber", "Apprentice Seer", "Witch", "Paranormal Investigator", "Marksman", "Psychic", "Nostradamus", "Thing", "Child", "Petshop Owner", "Minion", "Mystic Wolf", "Observer Wolf", "Shaman Wolf", "Alpha Wolf"]), // All normal roles
  n4 : new Set(["Witch", "Paranormal Investigator", "Insomniac", "Drunk", "Troublemaker", "Village Idiot", "Revealer", "Exposer", "Curator", "Pickpocket", "Gremlin", "Rascal", "Empath", "Beholder", "Aura Seer", "Parity Sheriff", "Analyst", "Mortician", "The Blob", "Guardian Angel", "Squire", "Observer Wolf"]),
  dday : new Set([]),
  dvote : new Set(["Bodyguard", "Prince", "Cursed", "Hunter", "Diseased"]),
}

export const Times = { 
  FirstStage : 30,
  SecondStage : 20,
  ThirdStage : 10
}

export const Switches = {
  RandomiseRoles : true,
  MessagePublic : true,
}

let emoji
/*
//Depending on the date. Have some special dates case.
let year = Number(new Date().toISOString().split('T')[0].substring(0,4))
let month = Number(new Date().toISOString().split('T')[0].substring(5,7))
let day = Number(new Date().toISOString().split('T')[0].substring(8,10))

if (month === 4 && day === 23){emoji = ":dragon_face:"} // St George's Day
else if (month === 11 && day === 5){emoji = ":fireworks:"} // Bonfire night
else if (month === 12 && day >= 24 && day <= 26){emoji = ":santa:"} //Christmas
else if (month === 12 && day === 31){emoji = ":fireworks:"} // NYE
else if (month === 2 && day === 14){emoji = ":heartpulse:"} // Valentines
else if (month === 10 && day === 31){emoji = ":ghost:"} //Halloween
else if (month === 4 && day === 1){emoji = ":black_joker:"} //April Fools
else if (month === 1 && day === 8){emoji = ":partying_face:"} // Discord bot's birthday
else if (month === 2 && day === 29){emoji = ":game_die:"} // Feb 29th

else if (month === 6 && day === 18){emoji = ":man:"} // Father's Day
else if (month === 3 && day === 19){emoji = ":woman:"} // Mother's Day
else if (month === 6 && day === 21){emoji = ":sun_with_face:"} // Summer Solstice
else if (month === 12 && day === 22){emoji = ":snowflake:"} //Winter Solstics
*/

let startemoji = ""
let endemoji = ""
if (emoji){
  startemoji = emoji + " "
  endemoji = " " + emoji
}
export const RoleDict = {
  "Doppelganger": `Your role is the ${startemoji}Doppelganger${endemoji}. You are originally on Team Town.`,
  "Werewolf": `Your role is the ${startemoji}Werewolf${endemoji}. You win if no werewolves are lynched. You are on Team Werewolf.`,
  "Minion": `Your role is the ${startemoji}Minion${endemoji}. You are on Team Werewolf.\nIf there are wolf players, you win if you are lynched.\nIf there are no wolf players, you win if nobody on your team is lynched.`,
  "Mason": `Your role is the ${startemoji}Mason${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Seer": `Your role is the ${startemoji}Seer${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Robber": `Your role is the ${startemoji}Robber${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Troublemaker": `Your role is the ${startemoji}Troublemaker${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Drunk": `Your role is the ${startemoji}Drunk${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Insomniac": `Your role is the ${startemoji}Insomniac${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Apprentice Tanner": `Your role is the ${startemoji}Apprentice Tanner${endemoji}. You know who the Tanners are. You win if the Tanner dies. If there are no Tanners, you win if you are killed. You are neither on Team Town nor Team Werewolf.`,
  "Witch": `Your role is the ${startemoji}Witch (Voodoo Lou)${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Alpha Wolf": `Your role is the ${startemoji}Alpha Wolf${endemoji}. You win if no werewolves are lynched. You are on Team Werewolf.`,
  "Assassin": `Your role is the ${startemoji}Assassin${endemoji}. At night, choose one target. You win if your target is lynched. Your target knows they are marked. You are neither on Team Town nor Team Werewolf.`,
  "Dream Wolf": `Your role is the ${startemoji}Dreamwolf${endemoji}. You win if no werewolves are lynched. You do not know who the other werewolves are. You are on Team Werewolf.`,
  "Apprentice Seer": `Your role is the ${startemoji}Apprentice Seer${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Mystic Wolf": `Your role is the ${startemoji}Mystic Wolf${endemoji}. You win if no werewolves are lynched. You are on Team Werewolf.`,
  "Paranormal Investigator": `Your role is the ${startemoji}Paranormal Investigator${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Village Idiot": `Your role is the ${startemoji}Village Idiot${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Revealer": `Your role is the ${startemoji}Revealer${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Oracle": `Your role is the ${startemoji}Oracle${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Villager": `Your role is the ${startemoji}Villager${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Hunter": `Your role is the ${startemoji}Hunter${endemoji}. If you are lynched, the person you voted for is also lynched. You win if any werewolf is lynched. You are on Team Town.`,
  "Tanner": `Your role is the ${startemoji}Tanner${endemoji}. You win if you are lynched. You are neither on Team Town nor Team Werewolf.`,
  "Prince": `Your role is the ${startemoji}Prince${endemoji}. Any vote given to you does not count. You win if any werewolf is lynched. You are on Team Town.`,
  "Bodyguard": `Your role is the ${startemoji}Bodyguard${endemoji}. The player you vote for cannot be killed. You win if any werewolf is lynched. You are on Team Town.`,
  "Sentinel": `Your role is the ${startemoji}Sentinel${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "The Blob": `Your role is The ${startemoji}Blob${endemoji}. You must keep yourself and all parts of The Blob alive.`,
  "Apprentice Assassin": `Your role is the ${startemoji}Apprentice Assassin${endemoji}. You win if the Assassin is lynched, or if your target is lynched if there are no Assassins. You are neither on Team Town nor Team Werewolf.`,
  "Cursed": `Your role is the ${startemoji}Cursed${endemoji}. You are on Team Town unless a werewolf votes for you - where you become a Werewolf and join the Werewolf Team.`,
  "Parity Sheriff": `Your role is the ${startemoji}Parity Sheriff${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Cupid": `Your role is the ${startemoji}Cupid${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Mortician": `Your role is the ${startemoji}Mortician${endemoji}. You win if either of your neighbors is lynched. You are neither on Team Town nor Team Werewolf.`,
  "Beholder": `Your role is the ${startemoji}Beholder${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Analyst": `Your role is the ${startemoji}Analyst${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Sly Fox": `Your role is the ${startemoji}Sly Fox${endemoji}. You win if you receive 0 votes, and everyone else loses. You are neither on Team Town nor Team Werewolf.`,
  "Shaman Wolf" : `Your role is the ${startemoji}Shaman Wolf${endemoji}. You win if no werewolves are lynched. You are on Team Werewolf`,
  "Child" : `Your role is the ${startemoji}Child${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Prophet" : `Your role is the ${startemoji}Prophet${endemoji}. You win if your target wins. You are neither on Team Town nor Team Werewolf.`,
  "Guardian Angel" : `Your role is the ${startemoji}Guardian Angel${endemoji}. You win if your target receives 0 votes and is not killed.`,
  "Observer Wolf" : `Your role is the ${startemoji}Observer Wolf${endemoji}. You win if no werewolves are lynched. You are on Team Werewolf.`,
  "Thing" : `Your role is the ${startemoji}Thing${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Curator" : `Your role is the ${startemoji}Curator${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Petshop Owner" : `Your role is the ${startemoji}Petshop Owner${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Instigator" : `Your role is the ${startemoji}Instigator${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Priest": `Your role is the ${startemoji}Priest${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Marksman" : `Your role is the ${startemoji}Marksman${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Pickpocket" : `Your role is the ${startemoji}Pickpocket${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Gremlin" : `Your role is the ${startemoji}Gremlin${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Exposer" : `Your role is the ${startemoji}Exposer${endemoji}. You win if any werewolf is lynched. You are on Team Town.`,
  "Squire": `Your role is the ${startemoji}Squire${endemoji}. You are on Team Werewolf.\nIf there are wolf players, you win if you are lynched.\nIf there are no wolf players, you win if nobody on your team is lynched.`,
  "Copycat": `Your role is the ${startemoji}Copycat${endemoji}. You are originally on Team Town.`,
  "Empath" : `Your role is the ${startemoji}Empath${endemoji}. You win if any werewolf is lynched. You are on Team Town.`
}

export const AllRoles = [
        "Prophet",
        "Oracle",
        "Copycat",
        "Doppelganger",
        "Cupid",                       //Added
        "Instigator",                  //Added
        "Priest",                      //Added
        "Assassin",                    //Added
        "Apprentice Assassin",
        "Guardian Angel",
        "Sentinel",                    //Added
        "Petshop Owner",               //Added
        "Werewolf",                    //Added
        "Alpha Wolf",                  //Added
        "Shaman Wolf",                 //Added
        "Mystic Wolf",
        "Minion",                      //Added
        "Apprentice Tanner",
        "Mason",                       //Added
        "Thing",
        "Seer",                        //Added
        "Apprentice Seer",             //Added
        "Paranormal Investigator",
        "Marksman",
        "Robber",                      //Added
        "Child",                       //Added
        "Witch",                       //Added
        "Pickpocket",
        "Parity Sheriff",              //Added
        "Analyst",
        "Troublemaker",                //Added
        "Village Idiot",
        "Gremlin",
        "Drunk",                       //Added
        "Insomniac",                   //Added
        "Squire",
        "Beholder",
        "Observer Wolf",
        "Revealer",
        "Exposer",
        "Empath",
        "Curator",                     //Added
        "The Blob",                    //Added
        "Mortician",                   //Added
        "Villager",                    //Added
        "Tanner",                      //Added
        "Sly Fox",                     //Added
        "Hunter",                      //Added
        "Dream Wolf",                  //Added
        "Prince",                      //Added
        "Bodyguard",                   //Added
        "Cursed",                      //Added
    ]

export const ProgrammedRoles = {
  randadded : new Array,
  all : new Set,
  major : Object.keys(categories),
  _sublist : {},
  _allRolesList : new Array,
  
get sublist(){
    if(!!Object.keys(this._sublist).length){
      return this._sublist
    }
    this._sublist = {}
    this.randadded = ["Random Any"]
    let obj = {}
    
    Faction.getters2.forEach((group, i) => {
      obj[group] = this.available(group)
      this.all = libs.Union(this.all, obj[group])////////////////////////////////

      if (i <= 2 && !!obj[group].length && !!this.randadded.length){ // Change this line if want "Random Ultimate"
        let t = (i <= 2) ? ("Random " + Object.keys(categories)[i]) : ("Random " + group)
      
        obj[group].push(t)
        if(!this.randadded.includes(t)){
          this.randadded.push(t)
        }
      }
    })
    
    let obj2 = this.categorised
    let merged = {...obj, ...obj2}
    this._sublist = merged
    return this._sublist
  },
  get categorised(){
    let obj = {}
    this.major.forEach(group => {
      for (const [category, subgroup] of Object.entries(categories[group])){
        let t = group + " " + category
        let n = this.available(subgroup)
        obj[t] = n
        this.all = libs.Union(this.all, n)//////////////////////////////////////////////////

        if (!!n.length && !!this.randadded.length){
        	let q = "Random " + t
          obj[t].push(q)
          if (!this.randadded.includes(q)){
            this.randadded.push(q)
          }
        }
      }
    })

    this.all = libs.Union(this.all, this.randadded)//////////////////////////
    this.all = libs.sortRolelist(this.all)/////////////////////////


    obj["Random"] = this.randadded
    obj["All"] = this.all
    return obj
  },
  available(group){
    if (typeof group === "string"){
      group = Faction[group]
    }
    let obj = []
    group.forEach(n => {
      if (this.allRolesList.includes(n)){
        obj.push(n)
      }
    })
    return obj
  },
  
  get allRolesList(){
  	if (!!Object.keys(this._allRolesList).length){return this._allRolesList}
    
    let temp = []
    AllRoles.forEach(role => {
      if (roles[role.replaceAll(" ", "_")]) {
        temp.push(role)
      }
    })
    this._allRolesList = temp
    return this._allRolesList
  } 
}


const CuratorBack = "tokens/CuratorBack.png"
const TokenBack = "tokens/back.png"
const MarkBack = "marks/back.png"

export const marks = {
//Delete fileLoc, backFileLoc, allVisible and selfVisible if not special
  template : {
    name : "Mark of the Template",
    description : "This is the template mark.",
    selfVisible : true,
    allVisible : false,
    fileLoc : "",
    backFileLoc : "marks/back.png",
  },
  Clarity : {
    name : "Mark of Clarity",
    description : "This mark does nothing.",
    backFileLoc : MarkBack
  },
  Love : {
    name : "Mark of Love",
    description : "Two of these are given to different people by a Cupid. If you have one, you will die if the person with the other token is killed.",
    backFileLoc : MarkBack
  },
  Assassin : {
    name : "Mark of the Assassin",
    description : "You are being hunted by an Assassin. If you die, they win.",
    backFileLoc : MarkBack
  },
  Traitor : {
    name : "Mark of the Traitor",
    description : "Given to you by an Instigator. You must kill someone on your team, only if you are on Team Town or Team Werewolf and not alone.",
    backFileLoc : MarkBack
  },
  Diseased : {
    name : "Mark of the Disease",
    description : "Given to you by a Diseased. If anyone votes for you, they lose.",
    backFileLoc : MarkBack
  },
  
}

export const tokens = {
//Delete fileLoc, backFileLoc, allVisible and selfVisible if not special
  template : {
    name : "Token of Template",
    description : "This is the Template token.",
    selfVisible : true,
    allVisible : false,
    fileLoc : "",
    backFileLoc : "tokens/back.png"
  },
  Werewolf : {
    name : "Claw of the Werewolf",
    description : "You are turned into a Werewolf.",
    backFileLoc : CuratorBack
  },
  Tanner : {
    name : "Cudgel of the Tanner",
    description : "You are turned into a Tanner.",
    backFileLoc : CuratorBack
  },
  Villager : {
    name : "Brand of the Villager",
    description : "You are turned into a Villager.",
    backFileLoc : CuratorBack
  },
  Hunter : {
    name : "Bow of the Hunter",
    description : "You are turned into a Hunter.",
    backFileLoc : CuratorBack
  },
  Bodyguard : {
    name : "Sword of the Bodyguard",
    description : "You are turned into a Bodyguard.",
    backFileLoc : CuratorBack
  },
  Prince : {
    name : "Cloak of the Prince",
    description : "You are turned into a Prince.",
    backFileLoc : CuratorBack
  },
  Traitor : {
    name : "Dagger of the Traitor",
    description : "You must kill someone on your team, only if you are on Team Town or Team Werewolf and not alone.",
    backFileLoc : CuratorBack
  },
  Muting : {
    name : "Mask of Muting",
    description : "You may not talk for the rest of the round. You may only communicate in emojis (text chat), humming (voice chat), or pointing (in-person).",
    backFileLoc : CuratorBack
  },
  Poet : {
    name : "Pen of the Poet",
    description : "You must talk in rhyme for the rest of the round.",
    backFileLoc : CuratorBack
  },
  Nothingness : {
    name : "Void of Nothingness",
    description : "Nothing has happened.",
    backFileLoc : CuratorBack
  },
  Shield : {
    name : "Shield",
    description : "A card with a Shield Token cannot be moved or viewed by any player.",
    allVisible : true,
    backFileLoc : TokenBack
  },
}

export const EmpathQuestions = [
  "the friendliest player",
  "the player who smells really good",
  "the smartest player",
  "the nicest player",
  "the player you think is the empath",
  "a player who is awesome",
  "the player you think is a sharp dresser",
  "the player you think everyone else is pointing at",
  "a player you really really like",
  "the player you think is really good looking",
  "the funniest player",
  "someone you don't think anyone else will point at",
  "the player you think has the best avatar"
]


export const wikiList = Object.entries(roleCards).map(([key, value]) => {
  return {
    name: key,
    card: value
  };
});