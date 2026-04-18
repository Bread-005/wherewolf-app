//import * as main from "./MainFile.js"
//import * as DS from "./DataStructures.js"
//import * as roles from "./roles.js"
import * as lookup from "./Constants.js"
import * as libs from "./GameFunctions.js"
//import * as RandomRoles from "./RandomRoles.js"


export function test(){
  //console.log(RandomRoles.wolfPower({"The Blob" : 1, "Seer" : 1, "Dream Wolf" : 1, "Werewolf" : 2, "Cursed" : 1}, 1))

  let n = 0
  lookup.AllRoles.forEach(r => {
    if (lookup.ProgrammedRoles._sublist["All"].includes(r)){
      n ++
    }
  })
  console.log(`Programmed ${n} out of ${lookup.AllRoles.length}, ${Math.round(n*10000/lookup.AllRoles.length)/100}%`)
  console.log("Tests")
}