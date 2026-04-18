import * as DS from "./DataStructures.js"
import * as roles from "./roles.js"
import * as lookup from "./Constants.js"
import * as words from "./Messagetext.js"
import {getDatabase, ref, update} from 'firebase/database';

export function listUsers(usersNames, userID, DisableSelf = true, allowNothing = true, DisableSentinelled = true, Sentinelled = []) {
  let options = []
  for (let i = 0; i < usersNames.length; i++) {
    let answer = DS.QuestionAnswer(
      usersNames[i], 
      !((userID === i && DisableSelf) || (Sentinelled.includes(i) && DisableSentinelled))
    )

    if (userID === i && DisableSelf) {
      answer.t += " (Cannot Target Self)"
    }
    if (Sentinelled.includes(i) && DisableSentinelled) {
      answer.t += " (Shielded)"
    }
    options.push(answer)
  }

  if (allowNothing) {
    options.push(DS.QuestionAnswer("Do Nothing"))
  }
  return options
}

export function listCentres(count, Disabled, allowNothing = true) {
  let options = []

  for (let i = 0; i < count; i++) {
    options.push(DS.QuestionAnswer(`Card ${i + 1}`, !Disabled.includes(i)))
  }
  
  if (allowNothing) {
    options.push(DS.QuestionAnswer("Do Nothing"))
  }
  return options
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
export function shuffleArray(array) {
  if (lookup.Switches.RandomiseRoles) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}


export function ArrayToObject(roleslist, object=true, keepInfo=false){
  if (typeof roleslist !== "object"){return roleslist}
  
  let roleslist2
  if (roleslist instanceof Set){
    roleslist2 = Array.from(roleslist)
  } else {
    roleslist2 = ("roles" in roleslist) ? roleslist.roles : roleslist
    if(roleslist2 instanceof Set){roleslist2 = Array.from(roleslist)}
  }
  
  if (!Array.isArray(roleslist2) && !object){
  // Turn into a list
    let temp = []
    for (const [key, value] of Object.entries(roleslist2)){
      for (let i = 0; i < value; i++) {
        let t = keepInfo ? DS.roleListEntry(key) : key
        temp.push(t)
      }
    }
    return temp

  } else if (Array.isArray(roleslist2) && object){
  // Turn into an object
    if (typeof roleslist2[0] === "object"){
      let temp = {}
      roleslist2.forEach(r => {
        temp[r.role] = temp[r.role] +1 || 1
      })
      return temp

    } else {
      let temp = {}
      roleslist2.forEach(r => {
        temp[r] = temp[r] +1 || 1
      })
      return temp
    }

  } else if (Array.isArray(roleslist2) && !object){
    // Keep as array
    if (typeof roleslist2[0] === "object"){
      if (!keepInfo){return roleslist2.map(r => {return r.role})}
      if (keepInfo){return roleslist2.map(r => {return DS.roleListEntry(r.role, r.random, r.extra, r.id)})}
    }
    if (keepInfo){return roleslist2.map(r => {return DS.roleListEntry(r, r)})}
    return [...roleslist2]

  } else if (!Array.isArray(roleslist2) && object){
    // Keep as object
    let temp = {}
    for (const [key, value] of Object.entries(roleslist2)){
      temp[key] = value
    }
    return temp

  }
  return roleslist
}

export function sortRolelist(roleslist, keepextra=false){

  if(!roleslist){return roleslist}

  let roleslistA = ArrayToObject(roleslist, false, true)

  // order the list
  let order = []
  let listOrder = lookup.AllRoles.concat([...lookup.ProgrammedRoles.randadded].reverse())

  listOrder.forEach(r => {
    let n = roleslistA.filter(roleT => {return roleT.role === r})
    
    n.forEach(roleT => {
      if(!roleT.random.includes("Random ")){
        order.push(roleT)
      }
    })

    lookup.ProgrammedRoles.randadded.forEach(r1 => {
      let n1 = n.filter(roleT1 => {return roleT1.random === r1})
      n1.forEach(roleT => {order.push(roleT)})
    })
  })

  if (!keepextra){
    order = order.filter(r => !r.extra)
  }
  if (typeof roleslist[0] !== "object"){
    order = ArrayToObject(order, false, false)
  }

  return order
}

export function displayRolesList(roleslist, blind){
  return roleslist.map(r => r.roletext(blind))
}

export function rolesForWiki(roleslist, blind){
  let a = new Set

  roleslist.forEach(r => {
    a.add(r.random)
    if (!blind){
      a.add(r.role)
    }
  })
  return sortRolelist(a)
}

export function roletext(role, blind=false){
  if (blind){return role.random}

  if (role.random!==role.role && !role.role.includes("Random ")){
    return `${role.role} (${role.random})`
  }
  return role.role
}

export function Union(...args){
  let s = new Set()
  args.forEach((arg, index) => {
    if (arg instanceof Set || arg instanceof Array){
      arg.forEach(s.add, s)
    } else {
      s.add(arg)
    }
  })
  return s
}

export function Intersect(...args){
  let n = Array.from(args[0])
  if (args.length === 1){return args[0]}

  args.forEach(set => {
    n.forEach(r => {
      if (set instanceof Array && !set.includes(r)){
        removeItem(n, r)
      } else if (set instanceof Set && !set.has(r)){
        removeItem(n, r)
      }
    })
  })
  return n
}

export function removeItem(arr, value){ 
  const index = arr.indexOf(value)
  if (index > -1) {
    arr.splice(index, 1)
  }
  return arr
}

export function joins(arr){
  if(!arr || !arr.length){return ""}
  if(!Array.isArray(arr)){return arr}
  return arr.join()
}


export function sendMessage(Game, userID, messageLocation, vars) {
  // userID will equal userID or 'Public'
  if (!(userID in Game.messages)){
    Game.messages[userID] = []
  }
  if (Game.messages[userID][Game.gamePhase] === undefined){
    Game.messages[userID][Game.gamePhase] = []
  }
  
  let MParts = messageLocation.split(".")
  if (typeof words[MParts[0]]["M" + MParts[1]] === "function"){
    vars = words[MParts[0]]["FM" + MParts[1]](Game, userID, vars)
  }
  
  Game.messages[userID][Game.gamePhase].push(DS.SendVars(messageLocation, vars))

  if(userID !== "public"){sendMessage(Game, "public", messageLocation, vars)}
}


export function clientMessage(DBMessage){ //specific to a single user
  // use the items in the message to look up how to fill in the blanks
  // get data from all phases. message[phases]
  // message.location, message.vars

  let messages = []
  if (!DBMessage || (Array.isArray(DBMessage) && !DBMessage.length)){return []}
  for (let key of Object.keys(DBMessage)){
    let messagePhase = DBMessage[key]
    if (!!messagePhase){
      messagePhase.forEach(message => {
        let text = ""
        if (!("vars" in message)){message.vars = []}
      
        let MParts = message.location.split(".")
        if (typeof words[MParts[0]]["M" + MParts[1]] === "function"){
          text = words[MParts[0]]["M" + MParts[1]](message.vars)
          message.vars.slice(1)
        } else {
          text = words[MParts[0]]["M" + MParts[1]]
        }
        if (message.vars.length){
          message.vars.forEach(var1 => {
            text = text.replace("$", var1)
          })
        }
        messages.push(text.trimEnd().split("\n"))
      })
    }
  }
  return messages
}


export function sendQuestion(Game, userID, QuestionLocation, vars = []) {
  // All this should do really is set the answers.
  // save location, answers, count, vars for the text, and which index is Do Nothing
  
  if (!Game.questions[userID]){Game.questions[userID] = {}}
  if (!Game.questions[userID][Game.gamePhase]){Game.questions[userID][Game.gamePhase] = new Array}
  if (!Game.answers[userID]){Game.answers[userID] = new Array}
  if (!Game.answers[userID][Game.gamePhase]){Game.answers[userID][Game.gamePhase] = {}}
  if (!Game.answerNothing[userID]){Game.answerNothing[userID] = new Array}
  if (!Game.answerNothing[userID][Game.gamePhase]){Game.answerNothing[userID][Game.gamePhase] = {}}
  
  
  console.log(userID, QuestionLocation)
  let t = generateAnswers(Game, userID, QuestionLocation)
  console.log(userID, QuestionLocation, t)
  vars = vars.concat(t.answers)
  
  Game.answers[userID][Game.gamePhase][QuestionLocation.split(".")[1]] = t.defaultAns
  Game.answerNothing[userID][Game.gamePhase][QuestionLocation.split(".")[1]] = t.nothing
  
  Game.questions[userID][Game.gamePhase].push(DS.SendVars(QuestionLocation, vars)) //(Question, Answer, Count, Vars = [], Default = -1)
  //updateDatabase(Game.questions, `question/${channel}`)
  // After this change has been detected, call constructQuestion(Role, Question, vars)
}

export function generateAnswers(Game, userID, questionLocation){
  let MParts = questionLocation.split(".")
  let lookupQuestion = words[MParts[0]][MParts[1]]
  console.log(lookupQuestion)
  let answers = lookupQuestion.Answer(Game, userID) //somethng here
  let defaultAns = []
  let nothing = answers.map(a => a.t).indexOf("Do Nothing")
  
  // Choose default
  let available = []
  if (Array.isArray(lookupQuestion.Default)){
    available = [...lookupQuestion.Default]
    shuffleArray(available)
  }
  if (available.length < lookupQuestion.Count){
      let t = answers.filter(k => {return k.a})
      shuffleArray(t)
      t.forEach(l => available.push(l))
      available = available.filter(n => n.t != "Abstain") //Remove the Abstains from the count
      if(available[0].t != "Do Nothing" || Math.random() > 0.5){ // Do Nothing must be the first option picked to count, 50% chance to ignore it anyway
        //remove all do nothings
        available = available.filter(n => n.t != "Do Nothing")
      }
  }
  defaultAns = available.slice(0, lookupQuestion.Count)
  defaultAns = defaultAns.map(n => answers.indexOf(n))
  
  return {answers : answers, defaultAns : defaultAns, nothing : nothing}
}

export function clientQuestion(questionPhase){ //specific to a single user
  // use the items in the question to look up how to fill in the blanks
  // no phases, just all active questions
  
  let questions = []
  questionPhase.forEach(question => {
    let MParts = question.location.split(".")
    let lookupQuestion = {
    Question : words[MParts[0]][MParts[1]].Question,
    Answer : new Array,
    Count : words[MParts[0]][MParts[1]].Count,
    location : MParts[1]}
    
    if (question.vars){       // All the $ first as string
      question.vars.forEach(var1 => {
        if (lookupQuestion.Question.includes("$")) {
          lookupQuestion.Question = lookupQuestion.Question.replace("$", var1)
        } else {
          lookupQuestion.Answer.push(var1)
        }
      })
    }
    questions.push(lookupQuestion)
  })
  
  return questions
}

export function clientVote(listOfAllUserNames, userID, abstain){
    let As = listUsers(listOfAllUserNames, userID, false, false, false, []) //DisableSelf, allowNothing, DisableSentinelled
    if (abstain){As.push(DS.QuestionAnswer("Abstain"))}
    return DS.QuestionQuestion("Vote Time!", As)
}


export function updateDatabase(value, path, base=false) {
  if (path.charAt(0) === "/") { path = path.substring(1) }
  let db = getDatabase();
  let updates = {};
  if(!base){updates['/' + sessionStorage.getItem('gameID') + '/jsx/game/' + path] = value}
  else {updates['/' + sessionStorage.getItem('gameID')+ '/'+ path] = value}
  update(ref(db), updates);
}

export function remap(object, template){
  for (const [key, value] of Object.entries(template)){
    if (value === undefined){
      // This is a setter. Ignore.
    } else if (object === undefined){
      object = deepcopy(template)
    } else if (object[key] === undefined && typeof value === "function"){
      object[key] = value
    } else if (object[key] === undefined && (typeof value !== "object")){
      object[key] = deepcopy(value)
    } else if (Array.isArray(value)){
      if (object[key] === undefined){
        object[key] = deepcopy(value)
      }
    } else if (typeof value === "object" && !Array.isArray(value)){
      if (object[key] === undefined){
        object[key] = Object.assign(value)
      } else {
        remap(object[key], template[key])
      }
    }
  }
}

export function constructGame(Game) {
  if (!isSetGet(Game, "centreCards")){
    Object.defineProperties(Game, {
      "centreCards" : {
        get(){
          if (this.allCards.length >= 3) {
            return this.allCards.slice(this.users.length)
          } else {
            return {}
          }
        }
      },
      "playerCards" : {
        get() {
          if (this.allCards.length >= 3) {
            return this.allCards.slice(0, this.users.length)
          } else {
            return {}
          }
        }
      }
    })
  }

  Game.allCards.forEach((card, i) => {
    let temprole
    card._history.forEach(role => {
      if (isSetGet(role, "name")){
        Object.defineProperties(role, {
          "name" : {
            get() {
              return this._name
            }
          },
          "namescore" : {
            get() {
              return this._name.replaceAll(" ", "_")
            }
          }
        })
      }
      temprole = roles[role.namescore]()
      remap(role, temprole)
    })
    let tempcard = DS.cardTemplate(card.id, temprole)
    
    if (isSetGet(card, "newName")){
      Object.defineProperties(card, {
        "view" : {
           get() {
             return this._history[0]
           }
        },
        "hide" : {
          set(newName) {
            this.hiddenAs = newName
          }
        },
        "become" : {
          set(newRole) {
            this._history.push(newRole)
          }
        },
        "viewname" : {
          get () {
            if (!this.hiddenAs) {
              return this._history[0].name
            } else {
              return this.hiddenAs
            }
          }
        },
        "current" : {
          get (){
            return this._history.slice(-1)[0]
          }
        }
      })
    }
    remap(card, tempcard)
  })
  let temp = DS.gameTemplate(Game.ID)
  remap(Game, temp)
}

export function updateDBGame(game) {
  let Game = deepcopy(game)

  Game.allCards.forEach((card, i) => {
    card._history.forEach(role => {
      delete role.PossibleActions
      //delete role.name
      //delete role.namescore
    })
    //delete card.hide
    //delete card.become
    //delete card.view
    //delete card.viewname
    //delete card.current
  })

  //delete Game.centreCards
  //delete Game.playerCards
  delete Game.seePlayerCard
  delete Game.seeCentre
  delete Game.swapCards
  delete Game.copyRole
  delete Game.seatUsers
  delete Game.getRole

  updateDatabase(Game, "game")
}

export function deepcopy(obj){
  // https://lodash.com/docs/#cloneDeep
  let Obj = JSON.parse(JSON.stringify(obj)) //cloneDeep(obj)
  return Obj
}

function isGetter (obj, prop) {
  let x = Object.getOwnPropertyDescriptor(obj, prop)
  if (x){
    return !!x['get']
  } else {
    return false
  }
}
function isSetter (obj, prop) {
  let x = Object.getOwnPropertyDescriptor(obj, prop)
  if (x){
    return !!x['set']
  } else {
    return false
  }
}
export function isSetGet (obj, prop){
  return isSetter(obj, prop) || isGetter(obj, prop)
}
