const { loglv } = require("./config.js");

class ratelimitHandler {
	#pause_sec = 60
	pause_exp = 1
	isLimiting = false
	limiterCache = { 'user': [], 'group': [] }
	#cachedTime = 1800_000

	get waitTimeMS() {
		var delay = Math.min(3600, this.#pause_sec * Math.pow(2, this.pause_exp - 1))
		return (delay + Math.random() * (delay * 0.2)) * 1000
	}
	get delayMulti() { return this.pause_exp }

	async backoff(I_amount = 1.0) {
		return new Promise((resolve, reject) => {
			let timeMS = this.waitTimeMS
			console.log(`${loglv.warn}\x1b[0m[\x1b[31mRatelimit-Handler\x1b[0m] Backing off for ${Math.round(timeMS * I_amount / 1000)} sec - Retry: ${new Date(Date.now() + timeMS * I_amount).toTimeString()}`)
			setTimeout(() => {
				this.pause_exp++
				resolve(true)
			}, timeMS * I_amount);
		})
	}
	cooloff() { if (this.pause_exp > 1) { this.pause_exp = this.pause_exp - this.pause_exp * 0.1 } else if (this.pause_exp < 1) { this.pause_exp = 1 } }

	sweepCache() {
		var count = 0
		var totalc = 0
		Object.keys(this.limiterCache).forEach(k => {
			var fromc = this.limiterCache[k].length
			totalc += this.limiterCache[k].length
			this.limiterCache[k] = this.limiterCache[k].filter(c => c.cache_expire > Date.now())
			count += fromc - this.limiterCache[k].length
		})
		console.log(`${loglv.info}\x1b[0m[\x1b[31mRatelimit-Handler\x1b[0m] Sweeping API-Cache: ${count} of ${totalc} => ${totalc - count}`)
	}

	async reqCached(I_type, I_cacheSearch, I_giveData = false) {
		return new Promise((resolve, reject) => {
			if (I_giveData == true) {
				var search = this.limiterCache[I_type].find(c => c.tagId == I_cacheSearch && c.cache_expire > Date.now())
				if (search != undefined) {
					resolve(search['data'])
				} else {
					reject('Not Cached or is Expired')
				}
			} else {
				var search = this.limiterCache[I_type].find(c => c.data.id == I_cacheSearch && c.cache_expire > Date.now())
				if (search != undefined) {
					resolve(search)
				} else {
					reject('Not Cached or is Expired')
				}
			}
		})
	}

	async req(I_request, I_tag = '', I_itemUUID = '', I_maxAttempts = 6) {
		let self = this
		return new Promise((resolve, reject) => {
			checkLimit()
			function checkLimit() {
				if (self.isLimiting == false) {
					attemptRequest()
				} else {
					console.log(`${loglv.hey}\x1b[0m[\x1b[31mRatelimit-Handler\x1b[0m] Holding off on Request, Backoff protocol is active.`)
					setTimeout(() => {
						checkLimit()
					}, self.delayMulti * 10000)
				}
			}
			async function attemptRequest() {
				var res = await I_request
				if (res.error?.statusCode == 429 || res.error?.response.status == 429) {
					self.isLimiting = true
					// console.error('429')
					await self.backoff()
					if (self.pause_exp >= I_maxAttempts) { self.isLimiting = false; resolve(res) } else { attemptRequest() }
				} else if (res.error?.statusCode == 500 || res.error?.response.status == 500) {
					self.isLimiting = true
					console.error('500')
					await self.backoff(0.2)
					if (self.pause_exp >= I_maxAttempts) { self.isLimiting = false; resolve(res) } else { attemptRequest() }
				} else {
					self.isLimiting = false
					self.cooloff()
					if (I_tag != '') {
						if (I_itemUUID != '') {
							try {
								self.limiterCache[I_tag].push({ 'tagId': I_itemUUID, 'data': res, 'cache_expire': Date.now() + self.#cachedTime })
							} catch (err) {
								self.limiterCache[I_tag] = [{ 'tagId': I_itemUUID, 'data': res, 'cache_expire': Date.now() + self.#cachedTime }]
							}
						} else {
							res['cache_expire'] = Date.now() + self.#cachedTime
							try {
								self.limiterCache[I_tag].push(res)
							} catch (err) {
								self.limiterCache[I_tag] = [res]
							}
						}
					}
					resolve(res)
				}
			}
		})
	}
}
exports.ratelimitHandler = ratelimitHandler