function col(text = '', demo = false) {
	const dict = {
		"♫0": `\x1b[0m`, "♫S": `\x1b[1m`, "♫s": `\x1b[2m`, "♫f": `\x1b[5m`,
		"♫l": `\x1b[30m`, "♫r": `\x1b[31m`, "♫g": `\x1b[32m`, "♫y": `\x1b[33m`, "♫b": `\x1b[34m`, "♫m": `\x1b[35m`, "♫c": `\x1b[36m`, "♫w": `\x1b[37m`,
		"♫L": `\x1b[40m`, "♫R": `\x1b[41m`, "♫G": `\x1b[42m`, "♫Y": `\x1b[43m`, "♫B": `\x1b[44m`, "♫M": `\x1b[45m`, "♫C": `\x1b[46m`, "♫W": `\x1b[47m`
	};

	const pattern = new RegExp(Object.keys(dict).join("|"), "g");
	if (demo == true) { text = `♫0♫s♫l███♫r███♫g███♫y███♫b███♫m███♫c███♫w███\n♫0♫l███♫r███♫g███♫y███♫b███♫m███♫c███♫w███\n♫S♫l███♫r███♫g███♫y███♫b███♫m███♫c███♫w███♫0` }
	return text.replace(pattern, (match) => dict[match])
}

console.log(col(``, true))

console.log(col(`
╒═══════════════════╤══════════════════════════════════════╗
│♫g▫♫0♫s♫wVRChat Population♫0 │♫M         ♫wPlayers in Instance          ♫0║
│♫c▪Current Instance ▪♫0│            ♫B  ♫w16 / 80  ♫0               ║
│♫g▫♫0♫s♫wWorld Hop♫0         │♫S♫lVisitor♫0 ▪ ♫S♫bNew♫0 ▪ ♫gUser♫0 ▪ ♫yKnown♫0 ▪ ♫S♫mTrusted♫0║
│♫r▫♫0                  │   0       0     2       4       10   ║
│♫r▫♫0                  │  ♫0♫cJoin Me♫0 ▪ ♫S♫gOnline♫0 ▪ ♫yAsk Me♫0 ▪ ♫rBusy♫0    ║
│♫r▫♫0                  │     3        4        8       1      ║
│♫r▫♫0                  │       ♫S♫bComputer♫0 ▪ ♫gAndroid♫0 ▪ ♫wiOS♫0       ║
│♫r▫♫0                  │          15         1       0        ║
│♫r▫♫0                  │  ♫G♫l Group Members ♫0▪♫C♫l Retention Rate ♫0    ║
│♫r▫♫0                  │     Not Group          76 %          ║
╘═══════════════════╧══════════════════════════════════════╝
`))

console.log(col(`
╒═══════════════════╤══════════════════════════════════════╗
│♫g▫♫s♫wVRChat Population♫0 │ Instance Type:                       ║
│♫g▫♫s♫wCurrent Instance♫0  │  ♫rInvite+ Friends+ ♫gGroup+ ♫rGroupPublic♫0 ║
│♫c▪World Hop        ▪♫0│ Auto-Close:   ♫gEnabled♫0                ║
│♫r▫♫0                  │ Invite-Next:  ♫rDisabled♫0               ║
│♫r▫♫0                  │♫B ♫S♫wQueue                                ♫0║
│♫r▫♫0                  │  28                                  ║
│♫r▫♫0                  │♫B ♫S♫wTotal Explored                       ♫0║
│♫r▫♫0                  │  12144                               ║
│♫r▫♫0                  │♫B ♫S♫wPlayers tag along this session       ♫0║
│♫r▫♫0                  │  1                                   ║
╘═══════════════════╧══════════════════════════════════════╝
`))
