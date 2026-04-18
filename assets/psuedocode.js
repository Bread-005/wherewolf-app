

// Decide how to handle rooms.
// Do we want public and private rooms? Is there a dedicated host?
// Does the host have host controls or should anyone have options.
// Ranked rooms and unranked rooms?

// Get names of people in the room

// List all the roles as options. Maybe group them by factions. "Werewolf -> Alpha Wolf", or "Info Roles -> Seer".
// List some preset selection and some randomised selections. Reference RandomRoles.ts.
// Allow players to select the roles they want. Ensure they can remove roles.
// Add a random role as an option. Let the game decide.

// How long should the night be? Input text field probably.
// Do they want an abstain option? Circle select fields.

// If new people join or leave, update the random roles and the preset lists.
// Would be nice to have a "are you sure you want to refresh/leave" alert when you try to leave.

// Stop people from joining once the game starts. Make sure there are 3 or more players.

///////////////////////////////////////////////////
// ################ GAME STARTS ################ //
///////////////////////////////////////////////////

// Give each player a role. Put three in the centre
// Initialise marks

// List all the roles in the game. Probably in it's own box. List them in night order.
// If people hover over a role in the box, it should display a tooltip telling you what the role does.
// Think about a wiki as a side-bar to open and close to tell you more about each role.

// Update the centre cards if there are any alpha wolves.

// Prepare for multiple nights. See CanAct loop.

// 1. Prophet
// 2. Oracle
// 3. Copycat
// 4. Doppelganger

// 5. Cupid
// 6. Instigator
// 7. Priest
// 9. Apprentice Assassin -- I do this before assassin.
// 8. Assassin

// Deal with marks here

// 10. Guardian Angel
// 11. Sentinel
// 12. Petshop Owner

// 13. Werewolf
// 14. Alpha Wolf
// 15. Shaman Wolf
// 16. Mystic Wolf
// 17. Minion

// 18. Apprentice Tanner
// 19. Mason
// 20. Thing
// 21. Seer
// 22. Apprentice Seer
// 23. Paranormal Investigator
// 24. Marksman
// 25. Robber
// 26. Child
// 27. Witch
// 28. Pickpocket
// 29. Parity Sheriff
// 30. Normal Analyst
// 31. Insane Analyst
// 32. Paranoid Analyst
// 33. Confused Analyst
// 34. Troublemaker
// 35. Village Idiot
// 36. Gremlin

// 37. Drunk
// 38. Insomniac
// 39. Squire
// 40. Beholder
// 41. Observer Wolf

// 42. Revealer
// 43. Exposer
// 44. Empath
//       Prepare questions at the start of the night. Give them the whole night to answer.
// 45. Curator

// 46. The Blob
// 47. Mortician
// 48. Villager
// 49. Tanner
// 50. Sly Fox
// 51. Hunter
// 52. Dream Wolf
// 53. Prince
// 54. Bodyguard
// 55. Cursed


// Start a day phase.
// Allow option to vote to skip the rest of the day phase, go straight to voting.



// At the end of the day phase, go to voting.
// Send a vote message. Get vote responses
// List abstain if it's an option.

// Record who voted for who, and total up how many votes each person got.
// Prince is immune to votes.
// If cursed is voted for by a wolf, they become wolf.
// Sly Fox needs 0 votes to win
// Guardian Angel needs to protect their target

// Figure out who was lynched.
// Hunter takes effect.
// Cupid's arrow takes effect on the lynched person and anyone a hunter shot.

// If everyone had equal votes, no lynch.

// Figure out which of the neutral roles had no target and became Town in the process.
// Display the information.

// Figure out who won. Good luck me. The python code works. Try not to touch it.

// Display who wins.
// Display everyone's end role.
// Display everyone's mark or Curator Token.
// Display everyone's start role.
// Display intermediate roles if multiple nights.
// Display who everyone voted for.

// Generate score for each winner and loser if ranked.
// Update their stats with wins/losses/score/role count/winning streaks/date of last game/etc
// Figure out any achievements.
// Compress the data.



// Separate library to:
// Create options (Players, Centre cards)
// Read choices
// Switch two cards
// Order the roles appropriately 
// Format the role (what a viewing player sees)
// Deformat the role (what the initial player sees)
// List to string for names
// remove punctuation from win condition
// Send message
// Delete message

// View data
// Construct data
// Compress data
// Update data with new roles when added

// Help messages
// Role information
// Rules information

// Initialising, update files to and from dropbox

// Developer to speak to specific or all text chats
// Developer to read specific text chat

// Allow players to contact developers with problems
