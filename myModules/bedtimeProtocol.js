/*
-------------------------------------

	Don't stay on for too long

-------------------------------------
*/
//	--	Libraries	--
const { loglv } = require('./config.js')
const { oscChatBox,oscEmitter } = require('./Interface_osc_v1.js');
const { killvrc } = require('./sys_taskKill.js');

// Global Vars
let selfLog = `\x1b[0m[\x1b[31mAuto-Closer\x1b[0m]`
class oscStorage {
	constructor(bed_hrI=0,bed_minI=0,bed_activeI=false){
		this.bed_hr = bed_hrI
		this.bed_min = bed_minI
		this.bed_active = bed_activeI
	}
}
var logSay = ''
var timer = setInterval(() => { return }, 60_000);

// On Load
console.log(`${loglv().log}${selfLog} Loaded`)
var oscQ = new oscStorage()

// On Start
oscEmitter.on('osc', (address, value) => {
	if( address == '/avatar/parameters/bed_hr' ){ oscQ.bed_hr = value }
	if( address == '/avatar/parameters/bed_min' ){ oscQ.bed_min = value }
	if( address == '/avatar/parameters/bed_active' ){
		if( value == true ) {
			clearInterval(timer)
		
			let targetTimeStamp = Math.floor( Date.now() / 1000 ) + (oscQ.bed_min * 60) + (oscQ.bed_hr*3600); console.log(`${loglv().debug}${selfLog} ${targetTimeStamp}`)
			
			logSay = `Auto-Closing VRChat in ${oscQ.bed_hr} Hr and ${oscQ.bed_min} Min`
			console.log(`${loglv().hey}${selfLog} ${logSay}`);oscChatBox(`~${logSay}`)

			let lastHour = oscQ.bed_hr
			let lastMinute = oscQ.bed_min

			let secsRemaining = targetTimeStamp - Math.floor( Date.now() / 1000 )
			let secs2hours = Math.round( secsRemaining / 3600 )
			let secs2mins = Math.ceil( (secsRemaining - (secs2hours*3600) ) - ( secsRemaining / 60 ) )

			timer = setInterval(()=>{
				secsRemaining = targetTimeStamp - Math.floor( Date.now() / 1000 );
				//console.log(`${loglv().debug}${selfLog} _______________________________`)
				//console.log(`${loglv().debug}${selfLog} Total Secs: ${secsRemaining}`)

				secs2hours = Math.round( secsRemaining / 3600 )
				//console.log(`${loglv().debug}${selfLog} Hours: ${secs2hours}`)

				if( secs2hours > 0 && lastHour != secs2hours ){
					lastHour = secs2hours;
					console.log(`${loglv().debug}${selfLog} lastHour updated to ${lastHour}`)

					logSay = `Auto-Closing VRChat in ${secs2hours} hours`
					console.log(`${loglv().hey}${selfLog} ${logSay}`);
					oscChatBox(`~${logSay}`)
				}

				secs2mins = Math.ceil( (secsRemaining - (secs2hours*3600) ) / 60 )
				//console.log(`${loglv().debug}${selfLog} Minutes: ${secs2mins} _% 5 Remainder: ${secs2mins % 5}`)

				if( secs2hours == 0 && secs2mins > 0 && lastMinute != secs2mins ){
					lastMinute = secs2mins; 
					console.log(`${loglv().debug}${selfLog} lastMinute updated to ${lastMinute}`)

					// half-hour mark
					if( secs2mins == 30 ){
						logSay = `Auto-Closing VRChat in 30 minutes`
						console.log(`${loglv().hey}${selfLog} ${logSay}`);
						oscChatBox(`~${logSay}`)
					}
					// every 5 mins under half-hour
					else if( secs2mins >= 5 && secs2mins < 30 ){
						if( secs2mins % 5 == 0 ){
							logSay = `Auto-Closing VRChat in ${secs2mins} minutes`
							console.log(`${loglv().hey}${selfLog} ${logSay}`);
							oscChatBox(`~${logSay}`)
						}
					}
					// last 5 mins
					else if( secs2mins <= 5 && secs2mins > 1 ){
						logSay = `Auto-Closing VRChat in ${secs2mins} minutes`
						console.log(`${loglv().hey}${selfLog} ${logSay}`);
						oscChatBox(`~${logSay}`)
					}
					else if( secs2mins == 1 ){
						logSay = `Auto-Closing VRChat in ${secs2mins} minute`
						console.log(`${loglv().hey}${selfLog} ${logSay}`);
						oscChatBox(`~${logSay}`)
					}
				}
				
				// over
				if( secsRemaining <= 0 ){
					logSay = `Auto-Closing VRChat, Goodnight.`
					console.log(`${loglv().hey}${selfLog} ${logSay}`);
					oscChatBox(`~${logSay}`)
					killvrc(10)
					clearInterval(timer)
					//process.exit()	/* Also close OSC ? */
				}

			},1000)
		}
		if( value == false ){
			clearInterval(timer)
			logSay = `Canceled Auto-Close`
			console.log(`${loglv().hey}${selfLog} ${logSay}`);
			oscChatBox(`~${logSay}`)
		}
	}
});