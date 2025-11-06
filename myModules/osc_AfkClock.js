/*
-------------------------------------

	What all does this module do?
Keep timer of how long ago went AFK when enabled
Send message to chatbox every minute

-------------------------------------
*/
//	--	Libraries	--
const { loglv,afkclock } = require('./config.js')
const { oscChatBox,oscEmitter } = require('./Interface_osc_v1.js');

//	--	Global Vars	--
let selflog = `\x1b[0m[AfkClock\x1b[0m]`
var afktimer;
var afktime = 0

//	--	On Load	--
console.log(`${loglv().log}${selflog} Loaded -> ${loglv(afkclock)}Clock${loglv().reset}`)

//	--	Functions	--
function afkStartTimer() {
	afktime = 0
	console.log(`${loglv().log}${selflog} I am now AFK`)
	clearInterval( afktimer )
	afktimer = setInterval(()=>{
		afktime++
		//console.log(`${loglv().debug}${selflog} akttime ${getAfkTime()}`)
		var afkmsgS = ''
		var afkmsgEx = ''
		if( afktime > 1 ){ afkmsgS = 's'}
		//if( afktime == 5 ){ afkmsgEx = ' + Invites and Requests will now be Auto-Denied'}
		console.log(`${loglv().log}${selflog} AFK for ${afktime} minute${afkmsgS}`)
		oscChatBox(`~Went AFK ${afktime} minute${afkmsgS} ago${afkmsgEx}`)
	},60*1000)
}


function getAfkTime() {
	return afktime
}
exports.getAfkTime = getAfkTime;


function afkStopTimer() {
	afktime = 0
	exports.afktime = 0
	console.log(`${loglv().log}${selflog} I am no longer AFK`)
	clearInterval( afktimer )
}

//	--	Events	--
var recentAvatarChange = 0
var racDiff = 0
oscEmitter.on('osc', (address, value) => {
	//console.log(`${loglv().debug}${selflog} ${address} = ${value}`)
	
	// Recently changed / loaded / refreshed
	
	if( address == '/avatar/change' ){
		recentAvatarChange = Date.now()
	}else{
		racDiff = Date.now() - recentAvatarChange
	}
	
	
	if( afkclock == true && address == '/avatar/parameters/AFK' ){
		
		// Dont trigger either AFK state if avatar updated while AFK already active 
		if( racDiff > 50 && afktime >= 1 ){ return }
		
		if( value == true ){ afkStartTimer() }
		if( value == false ){ afkStopTimer() }
	}
})