const fs = require('fs')
const { EventEmitter } = require('events');
const { loglv } = require('./config');
const cmdEmitter = new EventEmitter();
exports.cmdEmitter = cmdEmitter;

const cmdInputFile = "C:/Users/14anthony7095/Documents/14aOSC-API-Log/input.txt"
let selfLog = `\x1b[0m[INPUT\x1b[0m]`

cmdEmitter.on('cmd',(cmd,args)=>{
    console.log(`${loglv().log}${selfLog} Command recieved ${cmd} ${args}`)
})

fs.watchFile(cmdInputFile,(current,previous)=>{
    fs.readFile(cmdInputFile,'utf8',(err,data)=>{
        if(data != ''){
            data.split('\n').forEach(c=> {
                cmdEmitter.emit('cmd' , c.split(' ')[0].trim() , c.slice(c.split(' ')[0].trim().length+1).split(' ') , c )
            })
            fs.writeFile(cmdInputFile,'',{encoding:'utf8'},()=>{})
        }
    })
})