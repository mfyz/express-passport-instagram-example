const { Pool } = require('pg')
const argon2 = require('argon2')
const squel = require('squel').useFlavour('postgres')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
})

let connection = null

const getConnection = async () => {
	try {
		if (connection === null) {
			connection = await pool.connect()
			// console.log('------->>> Connection successful!')
		}
	}
	catch (e) {
		console.log('-----> DB connection error!', e)
	}
	return connection
}

const disconect = () => {
	try {
		return connection.release()
	}
	catch (e) {
		return false
	}
}

const runQuery = (query, values) => new Promise((resolve, reject) => {
	let queryObj = null
	if (values) queryObj = { text: query, values }
	else queryObj = query
	// console.log(queryObj)
	getConnection().then((conn) => {
		conn.query(queryObj, (err, res) => {
			// console.log('=======> query ' + (err ? 'error':'result') +':', query, (err ? err : res));
			if (err) reject(err)
			else resolve(res)
		})
	})
})

const getUserByAField = (field, value) => new Promise((resolve, reject) => {
	runQuery(`SELECT * FROM users WHERE ${field} = $1`, [value])
		.then((result) => {
			if (result.rowCount === 0) resolve(null)
			else resolve(result.rows[0])
		})
		.catch(err => reject(err))
})

const getUserById = id => getUserByAField('id', id)
const getUserByIgid = igid => getUserByAField('igid', igid)
const getUserByUsername = username => getUserByAField('username', username)
const getUserByEmail = email => getUserByAField('email', email)

const isUsernameInUse = async username => {
	return await getUserByUsername(username) !== null
}

const isEmailInUse = async email => {
	return (await getUserByEmail(email) ? true : false)
}

const createUserRecord = (userObj, returnUserDbObj) => new Promise(async (resolve, reject) => {
	const qb = squel.insert()
		.into('users')

	const fields = 'email username igid igtoken'.split(' ')
	for (let i = 0; i < fields.length; i += 1) {
		if (typeof userObj[fields[i]] !== 'undefined') {
			qb.set(fields[i], userObj[fields[i]])
		}
	}

	if (typeof userObj['password'] !== 'undefined') {
		const passwdHash = await createPasswordHash(userObj.password)
		qb.set('passwd_hash', passwdHash)
	}

	qb.set('createdAt', 'NOW()')

	const queryStr = qb.toString()
	// console.log(queryStr)
	
	runQuery(queryStr)
		.then((result) => {
			if (result.rowCount === 1) {
				if (returnUserDbObj) {
					if (typeof userObj['username'] !== 'undefined') {
						getUserByUsername(userObj.username)
							.then(user => resolve(user))
							.catch(e => reject(e))
					}
					else if (typeof userObj['fbid'] !== 'undefined') {
						getUserByFbid(userObj.fbid)
							.then(user => resolve(user))
							.catch(e => reject(e))
					}
					else {
						resolve(true)	
					}
				}
				else {
					resolve(true)
				}
			}
			else resolve(false)
		})
		.catch((err) => {
			reject(err)
		})
})

const createPasswordHash = (password) => new Promise(async (resolve, reject) => {
	try {
		const hash = await argon2.hash(password)
		resolve(hash)
	} catch (err) {
		reject(err)
	}
})

const isPasswordHashVerified = (hash, password) => new Promise(async (resolve, reject) => {
	try {
		if (await argon2.verify(hash, password)) {
			resolve(true)
		}
		else {
			resolve(false)
		}
	} catch (err) {
		reject(err)
	}
})

module.exports = {
	getConnection,
	disconect,
	getUserById,
	getUserByIgid,
	getUserByUsername,
	getUserByEmail,
	isUsernameInUse,
	isEmailInUse,
	createUserRecord,
	isPasswordHashVerified,
}
