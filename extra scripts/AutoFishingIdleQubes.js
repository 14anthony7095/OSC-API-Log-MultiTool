// No longer used, got Blocked by cloudflare or site owner
async function fishingIdle(I_delay, I_target,I_targetGoal) {
    console.log(`Current Delay: ${I_delay}`);
    var request = await fetch('https://trueaq.com/api/fishing/cube/add/' + I_target + '/1?vrcKey=FishingKey', {
        method: 'GET',
        headers: { 'User-Agent': 'UnityPlayer/2022.3.22f2-DWR (UnityWebRequest/1.0, libcurl/8.5.0-DEV)' }
    })
    if (request.status == 200) {
        var data = await request.json();
        console.log(data)
        console.log(`${data.cubeDeposit[I_target]} / ${I_targetGoal} - [ ${Math.round(data.cubeDeposit[I_target] / I_targetGoal * 100)}% ] - ETA ${new Date((I_targetGoal - data.cubeDeposit[I_target]) * I_delay).toISOString().substring(11, 19)}`);
        setTimeout(() => {
            fishingIdle(Math.round(I_delay - (I_delay * 0.005)))
        }, I_delay)
    } else if (request.status == 429) {
        console.log(request.status);
        console.log('Adding 1sec to delay');
        setTimeout(() => {
            fishingIdle(I_delay + 1000)
        }, 10000)
    } else {
        console.log(request.status)
    }
}

fishingIdle(5000, 6, 50000)