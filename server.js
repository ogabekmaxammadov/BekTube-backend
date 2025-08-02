import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fetch from 'node-fetch'

dotenv.config()
const app = express()
const PORT = 5000

app.use(cors())

const API_KEY = process.env.YT_API_KEY

const cache = {}
const CACHE_DURATION = 1000 * 60 * 60 // 1 soat

const getCache = key => {
	const item = cache[key]
	if (item && Date.now() - item.timestamp < CACHE_DURATION) {
		return item.data
	}
	return null
}

const setCache = (key, data) => {
	cache[key] = { data, timestamp: Date.now() }
}

const fetchYouTubeAPI = async (url, cacheKey, res) => {
	const cached = getCache(cacheKey)
	if (cached) return res.json(cached)

	try {
		const response = await fetch(url)
		const data = await response.json()
		setCache(cacheKey, data)
		res.json(data)
	} catch (err) {
		res.status(500).json({ message: 'Xatolik', error: err.message })
	}
}

app.get('/api/popular', async (req, res) => {
	const { regionCode = 'US', pageToken } = req.query
	const cacheKey = `popular_${regionCode}_${pageToken || ''}`
	const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=20&key=${API_KEY}${
		pageToken ? `&pageToken=${pageToken}` : ''
	}`
	await fetchYouTubeAPI(url, cacheKey, res)
})

const createCategoryRoute = (path, query, extra = '') => {
	app.get(path, async (req, res) => {
		const { pageToken } = req.query
		const cacheKey = `${path}_${pageToken || ''}`
		let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${query}&type=video${extra}&key=${API_KEY}`
		if (pageToken) url += `&pageToken=${pageToken}`
		await fetchYouTubeAPI(url, cacheKey, res)
	})
}

createCategoryRoute('/api/music', 'music')
createCategoryRoute('/api/movies', 'movies')
createCategoryRoute('/api/news', 'news')
createCategoryRoute('/api/sport', 'sport')
createCategoryRoute('/api/shorts', 'shorts', '&videoDuration=short')

app.get('/api/video/:id', async (req, res) => {
	const { id } = req.params
	const cacheKey = `video_${id}`
	const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${id}&key=${API_KEY}`
	await fetchYouTubeAPI(url, cacheKey, res)
})

// 🔊 Server ishlayapti
app.listen(PORT, () => {
	console.log(`✅ Server http://localhost:${PORT} da ishlayapti`)
})
