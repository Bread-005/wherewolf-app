import * as lookup from "./Constants.js"

export const gameTemplate = (ID) => {
  return {
    ID,
    users: new Array(),
    allCards: new Array(),
    sentinelled: new Array(),
    marks: new Array,
    tokens : new Array,
    gamePhase: -1,
    continuePhase : -1,
    gameEnd : false,
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
    answers : new Array,
    questions : new Array,
    answerNothing : new Array,
    messages : {},

    achievements: {},
    empathQuestions: {},
    
    setup : {
      roleslist : new Array,
      Blind : false,
      Nights : 1
    },
    votePhase: {
      votes : new Array,
      Abstain : true, 
      augments: {
        cursed: new Array,
        escaped: new Array
      },
      highestVotes: {
        numVotes : 0,
        lynched : new Array,
        all : new Array
      },
      Fox: new Array,
      Angel: new Array,
      Hunted : new Array,
      Cupid : new Array,
      
      winners : {
        users : new Array,
        factions : {
          Wolf : false,
          Minions : false,
          Town : false,
          Fox : false,
          Tanner : false,
        }
      }
    },
    public: {
      Blob: false,
      Revealer : false,
      Exposer : false,
      Curator : false,
    },

    get centreCards() { //List the cards in the centre
      if (this.allCards.length >= 3) {
        return this.allCards.slice(this.users.length)
      } else {
        return {}
      }
    },
    get playerCards() { //List the cards in play
      if (this.allCards.length >= 3) {
        return this.allCards.slice(0, this.users.length)
      } else {
        return {}
      }
    },
    
    getRole(userID){
      userID = this.wrapIndex(userID)
      let temp = this.allCards.filter(i => {return i.ID == userID})[0]
      if (temp){return temp.current}
      return undefined
    },

    getMark(userID){
      userID = this.wrapIndex(userID)
      return buildMark(this.marks[userID])
    },
    
    getToken(userID){
      userID = this.wrapIndex(userID)
      let t = this.tokens[userID]
      if (!t || !t.length){
        return false
      }
      return buildToken(t)
    },

    setToken(userID, token){
      userID = this.wrapIndex(userID)
      if (!this.tokens[userID] || !this.tokens[userID].length){
        this.tokens[userID] = [token]
        return
      }
      this.tokens[userID].push(token)
    },
    setMark(userID, mark){
      userID = this.wrapIndex(userID)
      let replacedMark = this.marks[userID]
      this.marks[userID] = mark
      return replacedMark
    },
    
    getInfo(userID){
      userID = this.wrapIndex(userID)
      return {roleCardsList : this.users[userID].history, mark : this.getMark(userID), token : this.getToken(userID)}
    },
    addHistory(userID, role){ //Card, role, text
      userID = this.wrapIndex(userID)
      let n = role.viewname || role.name || role
      this.users[userID].history.push(n)
    },

    seePlayerCard(pos) {
      pos = this.wrapIndex(pos)
      return this.allCards[pos] //Get a card based on the position
    },
    seeCentre(targetnum) {
      return this.centreCards[targetnum] //Get a centre card based on the position
    },
    seeOwnCard(pos){
      pos = this.wrapIndex(pos)
      this.addHistory(pos, this.allCards[pos].viewname)
      return this.allCards[pos].viewname
    },
    swapCards(pos1, pos2) { //Swap two cards based on their positions
      //pos1 = this.wrapIndex(pos1)
      //pos2 = this.wrapIndex(pos2)
      let temp = this.allCards[pos1]
      this.allCards[pos1] = this.allCards[pos2]
      this.allCards[pos2] = temp
      this.allCards[pos1].location = pos1
      this.allCards[pos2].location = pos2
    },
    copyRole(mapto, mapfrom) { // For Doppelgangers, PI's etc
      //mapto = this.wrapIndex(mapto)
      //mapfrom = this.wrapIndex(mapfrom)
      this.allCards[mapto].history.push(this.allCards[mapfrom].view)
    },
    seatUsers() {
      
      for (let i = 0; i < this.users.length; i++) {
        this.users[i].position = i
        this.marks[i] = markTemplate()
        this.tokens[i] = new Array
        this.addHistory(i, this.allCards[i].current)
        //this.users[i].history = [this.allCards[i].current.namescore]
        this.messages[i] = new Array
        this.questions[i] = new Array
        this.answers[i] = new Array
        this.answerNothing[i] = new Array
      }
    },
    wrapIndex(index){
      while(index >= this.users.length){
        index -= this.users.length
      }
      while(index<0){
        index += this.users.length
      }
      return index
    }
  }
}


export const markTemplate = (ID="Clarity", benefactor=-1) => {
  return {
    ID,
    benefactor
  }
}

export const tokenTemplate = (ID, benefactor) => {
  return {
    ID,
    benefactor,
  }
}

export function buildMark(mark){
  return {
    name : lookup.marks[mark.ID].name,
    description : lookup.marks[mark.ID].description,
    ID : mark.ID,
    benefactor : mark.benefactor,
    selfVisible : (!!mark.selfVisible) ? mark.selfVisible : (!!lookup.marks[mark.ID].selfVisible) ? lookup.marks[mark.ID].selfVisible : true,
    allVisible : (!!mark.allVisible) ? mark.allVisible : (!!lookup.marks[mark.ID].allVisible) ? lookup.marks[mark.ID].allVisible : false,
    fileLoc : (!!lookup.marks[mark.ID].fileLoc) ? lookup.marks[mark.ID].fileLoc : `marks/${mark.ID.replaceAll(" ", "_")}.png`,
    backFileLoc : (!!lookup.marks[mark.ID].backFileLoc) ? lookup.marks[mark.ID].backFileLoc : "marks/back.png"
  }
}
export function buildToken(token){
  return {
    name : lookup.tokens[token.ID].name,
    ID : token.ID,
    description : lookup.tokens[token.ID].description,
    benefactor : token.benefactor,
    selfVisible : (!!token.selfVisible) ? token.selfVisible : (!!lookup.tokens[token.ID].selfVisible) ? lookup.tokens[token.ID].selfVisible : true,
    allVisible : (!!token.allVisible) ? token.allVisible : (!!lookup.tokens[token.ID].allVisible) ? lookup.tokens[token.ID].allVisible : false,
    fileLoc : (!!lookup.tokens[token.ID].fileLoc) ? lookup.tokens[token.ID].fileLoc : `tokens/${token.ID.replaceAll(" ", "_")}.png`,
    backFileLoc : (!!lookup.tokens[token.ID].backFileLoc) ? lookup.tokens[token.ID].backFileLoc : "tokens/back.png"
  }
}


export const userTemplate = (name, _userID) => {
  return {
    position: 0,
    name,
    _userID,
    history : new Array
  }
}

export const cardTemplate = (ID, _role) => {
  return {
    ID,
    _history: [_role],
    location: ID,
    hiddenAs: '',
    tokens: [],
    target: -1,
    selfVisible : true,
    allVisible : false,
    get view() {
      return this._history[0]
    },
    get viewname() {
      if (!this.hiddenAs) {
        return this._history[0].name
      } else {
        return this.hiddenAs
      }
    },
    get current() {
      return this._history.slice(-1)[0]
    },
    set hide(newName){
      this.hiddenAs = newName
    },
    set become(newRole){
      this._history.push(newRole)
    }
  }
}

export const roleTemplate = (_name) => {
  return {
    _name,
    get name() {
      return this._name
    },
    get namescore(){
      return this._name.replaceAll(" ", "_")
    },
    alliance: 'Town',
    Information: {},
    PossibleActions: {},
    Actions: {},
    actionIn: 3
  }
}

export const roleListEntry = (role, random="", extra=false, id=-1) => {
  random = random || role
  return {
    role,
    random,
    extra,
    id
  }
} 

export function QuestionQuestion(Question, Answer) {
  return {
    Question,
    Answer,
    Count: 1,
    Vars: new Array,
    Default: -1 // -1 is Random
  }
}

export function QuestionAnswer(t, a = true) {
  return {
    t, //text
    a //available
  }
}

export function SendVars(location, vars){
  return {
    location,
    vars
  }
}

export function empathQuestions(text, target, empathID) {
  return {
    text,
    target, // A list of people by their game Position
    empathID, // Who the answers should go back to
  }
}

export function actionTemplate(action, vars) {
  return {
    action,
    vars
  }
}

export function votesTemplate(voteFor, voterID) {
  return {
    voteFor,
    voterID
  }
}

export function escapeTemplate(position) {
  return {
    position,
    bodyguard: false,
    prince: false,
    votes: 0
  }
}
