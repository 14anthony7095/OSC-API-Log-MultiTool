// const { oscSend } = require('./Interface_osc_v1')
var fs = require('fs')


function old() {
  var dataCache = {}
  memberlist.forEach((mem, index, arr) => {
    var dataTarget = mem.isRepresenting
    if (isNaN(dataCache[dataTarget])) {
      dataCache[dataTarget] = 1
    } else {
      dataCache[dataTarget]++
    }

    if (index + 1 == arr.length) {
      console.log(dataCache)
    }
  })
}

var cycleParamList = {
  'Hat Toggle': 'bool',
  'Uniform Toggle': 'bool',
  'reinit': 'bool'
}
function cycleParams(List) {
  Object.keys(List).forEach(param => {
    let valtype = List[param]
    oscSend('/avatar/parameters/' + param, valtype == 'bool' ? Math.random() > 0.5 : false)
  })
  setTimeout(() => { cycleParams(List) }, 1000)
}
// cycleParams(cycleParamList)

function makeEpisodeQueueList(series = 'unnamed', type = 'TV-Show', seasondata = [10, 11, 4]) {
  var eplist = `# ${series}
**${type}**`
  seasondata.forEach((s, index, arr) => {
    eplist += `\n    Season ${index + 1}
\``
    for (i = 0; i < s; i++) {
      eplist += ` ${i + 1}`.padStart(2, "0")
    }
    eplist += `\``
  })

  console.log(eplist)
}

// makeEpisodeQueueList(`Samurai Jack`,`Anime`,[13,13,13,13,10])



// countEntries(``)
function countEntries(list) {
  let counts = {}
  list.split(`\n`).forEach(name => {
    if (!counts[name]) {
      counts[name] = 1
    } else {
      counts[name]++
    }
  })
  console.log(counts)
}
setInterval(() => { }, 30)
