const fs = require('fs')
const { EventEmitter } = require('events');
const { loglv } = require('./config');
const cmdEmitter = new EventEmitter();
exports.cmdEmitter = cmdEmitter;

const cmdInputFile = "C:/Users/14anthony7095/Documents/14aOSC_Multi-Interface/input.txt"
let selflog = `\x1b[0m[INPUT\x1b[0m]`

// cmdEmitter.on('cmd', (cmd, args, raw) => { })

fs.watchFile(cmdInputFile, (current, previous) => {
	fs.readFile(cmdInputFile, 'utf8', (err, data) => {
		if (data != '') {
			data.split('\r\n').forEach((c, index, arr) => {
				setTimeout(() => {
					let cmd = c.split(' ')[0].trim()
					console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) Command recieved ${cmd} ${c.slice(cmd.length + 1)}`)
					cmdEmitter.emit('cmd', cmd, c.slice(c.split(' ')[0].trim().length + 1).split(' '), c)
				}, 10_000 * index);
			})
			fs.writeFile(cmdInputFile, '', { encoding: 'utf8' }, () => { })
		}
	})
})