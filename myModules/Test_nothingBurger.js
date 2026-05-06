// const { oscSend } = require('./Interface_osc_v1')
var fs = require('fs')
const { table } = require('table');

async function sleep(time = 1) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(true)
		}, time);
	})
}

function elo(iRating, iVsRating, score, newPlayer) {
	var diff = iVsRating - iRating
	var expected = 1 / (Math.pow(10, diff / 400) + 1)
	var eloChange = (newPlayer == true ? 40 : 20) * (score - expected)
	var eloOutcome = Math.round((iRating + eloChange) * 10) / 10
	console.log(`(${iRating}) ${Math.sign(eloChange) == 1 ? '+' : ''}${Math.round(eloChange * 10) / 10} = ${eloOutcome}`)
	return eloOutcome
}
// console.log(elo(520, 1100, 2, true))

var worldHopBingoEntrees = [
	`probuilder textures`,
	`roblox game port`,
	`Z-Fighting`,
	`Spinning Skybox`,
	`Loud BGM Volume`,
	`Loud Videoplayer Volume`,
	`Lofi girl on player`,
	`Mario and/or Luigi`,
	`Glossy Materials`,
	`HEAVY Bloom`,
	`HEAVY Ambient Occlusion`,
	`ItsBeemo Prefab world`,
	`WispyWoo Prefab world`,
	`Playerlist history prefab`,
	`Pool table`,
	`QvPens`,
	`Siphon Coffee Prefab`,
	`Coffee MiniGreen maker set Prefab`,
	`Silent World, No Audio`,
	`"ai genarated" skybox`,
	`Aircraft prefab world`,
	`Can Noclip`,
	`Creative Flight`,
	`Avali Flight Prefab (OpenFlight)`,
	`ai genarated "art gallery"`,
	`Spin the Bottle drinking game prefab`,
	`ANY Drinking game prefab`,
	`Lighting not Baked`,
	`Terrian corner at 0 0`,
	`HQ and LQ mirrors overlap`,
	`Everything has specular highlights`,
	`Need password to enter world`,
	`Avatar pedestals facing wrong way`,
	`Too many realtime lights for meshRenders`,
	`Pink material / Missing shader`,
	`"Loli Collider"`,
	`Hookah prefab`,
	`YamaPlayer`,
	`VizVid VideoPlayer`,
	`ProTV VideoPlayer`,
	`IwaSync3 VideoPlayer`,
	`Inconsistent mirror buttons / UI`,
	`Lofi Hip Hop BGM`,
	`No "All-Off" Post Processing toggle`,
	`Too dark to see anything`,
	`Too bright to see anything`,
	`Invisible walls`,
	`Floating trees`,
	`RBS SleepKit2 Prefab`,
	`Mirror far from avatar selection `,
	`Mirror button non-functional `,
	`Mirror and button far apart `,
	`Flying Whales`,
	`Straight videogame rip`,
	`Giant Water plane`,
	`Light in a jar`,
	`HEAVY Fog`,
	`Rainy Glass shader`,
	`NSFW screenshots`,
	`Questionable screenshots`,
	`Lewd screenshots`,
	`NSFW images`,
	`Questionable images`,
	`Lewd images`,
	`NSFW object(s)`,
	`Questionable object(s)`,
	`Lewd object(s)`,
	`Sex Toys out in the open easily accessed`,
	`Bed`,
	`Bedroom`,
	`NPCs`,
	`Voice acting`,
	`Boats`,
	`Cars`,
	`Drivable cars`,
	`Drivable vehicles`,
	`Aircraft / planes`,
	`Drivable aircraft / planes`,
	`Drivable boats`,
	`Tanks`,
	`Drivable tanks`,
	`Vehicles`,
	`Avatar Pedestals `,
	`Motion captured npc animations`,
	`Roaming NPCs`,
	`Broken chairs`,
	`Polaroid camera prefab`,
	`Keypad prefab`,
	`Player doppelganger`,
	`Disclaimer to enter world`,
	`Texture or Mesh LOD failure`,
	`Bitcrushed audio`,
	`Ridiculously high reverb`,
	`Posable avatar puppet / doll`,
	`Bed with mirrors all around it`,
	`Missing wall colliders`,
	`VIP area`,
	`Jumping is disabled`,
	`Sleep timer / wake up clock`,
	`Sleep mode Darken`,
	`Meme world`,
	`"Cozy" world`,
	`Unreasonably large download size`,
	`AI generated world thumbnail`,
	`Modular synthesizer (VCV Rack)`,
	`Donkey kong arcade cabinet`,
	`Pac-Man arcade cabinet`,
	`Tetris`,
	`Super mario bros (arcade cabinet)`,
	`PC only`,
	`Android only`,
	`iOS only`,
	`PC + Android cross-platform`,
	`PC + iOS cross-platform`,
	`Android + iOS  cross-platform`,
	`PC + Android + iOS  cross-platform`,
	`Baked lighting discoloration artifacts`,
	`Baked lighting light bleed`,
	`Cursed thumbnail`,
	`Cursed`,
	`Meme images everywhere`,
	`Giant random objects floating in sky`,
	`Extremely slow movement`,
	`Extremely fast movement`,
	`Annoying collision`,
	`"Sticky" collider`,
	`Unrelated world thumbnail`,
	`Not desktop friendly`,
	`Not VR friendly`,
	`AD posters`,
	`Keypad with "1234" password`,
	`Gambling`,
	`No description`,
	`Has color Red`,
	`Has color Green`,
	`Has color Blue`,
	`Has color Yellow`,
	`Has color Cyan`,
	`Has color Pink`,
	`Has color Purple`,
	`Has color White`,
	`Has color Black`,
	`Has color Orange`,
	`Has color Brown`,
	`Wavy Grass`,
	`Nintendo game reference`,
	`Videogame reference`,
	`Screenshot of Desktop`
]
main()
async function main() {
	var matrix = [[], [], [], [], []]
	var charLimit = 50
	for (s = 0; s < 25; s++) {
		// 0
		if (s >= 0 && s <= 4) {
			let randindex = Math.floor(Math.random() * worldHopBingoEntrees.length)
			matrix[0].push('\n' + worldHopBingoEntrees[randindex].slice(0, charLimit) + '\n')
			worldHopBingoEntrees = worldHopBingoEntrees.filter(e => e != worldHopBingoEntrees[randindex])
		}
		// 1
		if (s >= 5 && s <= 9) {
			let randindex = Math.floor(Math.random() * worldHopBingoEntrees.length)
			matrix[1].push('\n' + worldHopBingoEntrees[randindex].slice(0, charLimit) + '\n')
			worldHopBingoEntrees = worldHopBingoEntrees.filter(e => e != worldHopBingoEntrees[randindex])
		}
		// 2
		if (s >= 10 && s <= 14) {
			if (s == 12) {
				matrix[2].push('\nFree Space\n')
			} else {
				let randindex = Math.floor(Math.random() * worldHopBingoEntrees.length)
				matrix[2].push('\n' + worldHopBingoEntrees[randindex].slice(0, charLimit) + '\n')
				worldHopBingoEntrees = worldHopBingoEntrees.filter(e => e != worldHopBingoEntrees[randindex])
			}
		}
		// 3
		if (s >= 15 && s <= 19) {
			let randindex = Math.floor(Math.random() * worldHopBingoEntrees.length)
			matrix[3].push('\n' + worldHopBingoEntrees[randindex].slice(0, charLimit) + '\n')
			worldHopBingoEntrees = worldHopBingoEntrees.filter(e => e != worldHopBingoEntrees[randindex])
		}
		// 4
		if (s >= 20 && s <= 24) {
			let randindex = Math.floor(Math.random() * worldHopBingoEntrees.length)
			matrix[4].push('\n' + worldHopBingoEntrees[randindex].slice(0, charLimit) + '\n')
			worldHopBingoEntrees = worldHopBingoEntrees.filter(e => e != worldHopBingoEntrees[randindex])
		}
	}

	// console.table( matrix )
	console.log(table(matrix))

}

// setInterval(() => { }, 30)