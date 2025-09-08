
function startvrc(worldid,instanceid) {
    require('child_process').execSync(`start "C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" "vrchat://launch/?ref=vrchat.com&id=${worldid}:${instanceid}~private(usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752)~region(use)"`)
}

function randomInstanceID(){
    return Math.floor( Math.random() * (99999 - 10000) + 10000 )
}
var idlehome = "wrld_c16e4dee-d149-4116-adbc-16bc30b664b0"
var rngland = "wrld_50a4de63-927a-4d7e-b322-13d715176ef1"
var idlecube = "wrld_bc647b75-363d-40ed-ac02-c576098a1efc"

startvrc(idlehome, randomInstanceID())
setTimeout(()=>{ startvrc(rngland, randomInstanceID()) },15_000)
setTimeout(()=>{ startvrc(idlecube, randomInstanceID()) },30_000)

