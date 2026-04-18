/*
import { getDatabase, onValue, ref } from "@firebase/database";
import * as libs from "./GameFunctions.js"
import * as lookup from "./Constants.js"


// Used by a user
export function detectRoleChange(userID){
  let Game = libs.updateLocalGame()
  return roleMessage(Game, userID)
}
function roleMessage(Game, userID){
  let role = Game.users[userID].current.name
  return lookup.RoleDict[role]
}

// Used by a user
export function detectMessage(userID){
  
  let Game = libs.updateLocalGame()

  let messageLocation = libs.readDatabase(`message/${userID}`)

  let message = libs.constructMessage(Game, userID, messageLocation) 

  return message // string
  //Display the message
}

// Used by a user
export function detectQuestion(userID){
  //DEPRECIATED DO NOT USE
  return

  let Game = libs.updateLocalGame()
  let questionList = libs.readDatabase(`/question/${userID}`)

  let question = libs.constructQuestion(Game, userID, questionList) 

  return question
  // question in the form of libs.QuestionQuestion()

  // Display the question
  // The options are in the form DataStructures.QuestionAnswer
  // The user must pick a number of options = answerCount
  // The order of the options picked DOES matter. Should update the UI to reflect that. Allow them to change the order.
}

// Used by a user, perhaps after continue=true, maybe not. Depends if you want it to update realtime or not
export function saveAnswer(userID, answers, targetQuestion){
  
  let answersOG = libs.readDatabase(`answer/${userID}`)
  let questionsOG = libs.readDatabase(`question/${userID}`)
  let phase = libs.readDatabase(`game/gamePhase`)
  let continuePhase = libs.readDatabase(`game/continuePhase`)
  saveAnswer2(userID, answersOG, answers, phase, continuePhase, questionsOG, targetQuestion)
}
function saveAnswer2(userID, answersOG, answersNew, phase, continuePhase, questionsOG, targetQuestion){
  if (continuePhase !== 1 || !questionsOG || questionsOG.length === 0){
    return
  }

  if (!answersOG){
    answersOG = {}
  }
  if (!answersOG[phase]){
    answersOG[phase] = {}
  }
  
  let questionslist = questionsOG[phase].map(i => {return i.location})

  answersOG[phase][questionslist.indexOf(targetQuestion)] = answersNew
  libs.updateDatabase(answersOG,  `answer/${userID}`)
}
*/