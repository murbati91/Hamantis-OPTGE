import http from 'node:http'
import https from 'node:https'

/**
 * Minimal backend proxy for the AI Deck Builder's "Refine with Claude" step.
 *
 * This exists so the browser NEVER calls an LLM provider directly and no API
 * key is ever shipped to the client: the frontend calls this same-origin
 * `/api/deck/refine` route (reverse-proxied by nginx), and this process is
 * the only thing that ever reads ANTHROPIC_API_KEY.
 *
 * Zero third-party dependencies on purpose — this is a single-route proxy,
 * not an app; Node's built-in http/https modules are enough.
 */

const PORT = Number(process.env.DECK_REFINE_PORT ?? 8791)
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) })
  res.end(payload)
}

function readBody(req, limitBytes = 200_000) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error('Request body too large.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data))
            } catch {
              reject(new Error('Malformed response from Anthropic.'))
            }
          } else {
            reject(new Error(`Anthropic API ${res.statusCode}: ${data.slice(0, 200)}`))
          }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function buildPrompt({ leaderName, archetype, deckCards }) {
  const deckList = deckCards
    .map((d) => `${d.count}x ${d.name} (${d.id}, ${d.type}, cost ${d.cost ?? '-'}, power ${d.power ?? '-'})`)
    .join('\n')
  return `You are a One Piece Card Game deckbuilding expert. Review this ${archetype} deck.

Leader: ${leaderName}
Deck (50 cards):
${deckList}

Give concise, specific feedback in under 180 words:
1. 3-5 concrete swap suggestions (cut X for Y, with a one-line reason).
2. A 2-sentence game plan.
Do not restate the whole list.`
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true, configured: Boolean(process.env.ANTHROPIC_API_KEY) })
    return
  }

  if (req.method !== 'POST' || req.url !== '/api/deck/refine') {
    sendJson(res, 404, { error: 'Not found.' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    sendJson(res, 503, { error: 'AI refinement is not configured on this server.' })
    return
  }

  try {
    const raw = await readBody(req)
    const payload = JSON.parse(raw)
    const { leaderName, archetype, deckCards } = payload ?? {}
    if (typeof leaderName !== 'string' || typeof archetype !== 'string' || !Array.isArray(deckCards)) {
      sendJson(res, 400, { error: 'Invalid request body.' })
      return
    }
    const prompt = buildPrompt({ leaderName, archetype, deckCards })
    const data = await callAnthropic(apiKey, prompt)
    const text = data?.content?.[0]?.text
    if (typeof text !== 'string') {
      sendJson(res, 502, { error: 'Unexpected response shape from Anthropic.' })
      return
    }
    sendJson(res, 200, { text })
  } catch (err) {
    sendJson(res, 502, { error: err instanceof Error ? err.message : 'AI refinement failed.' })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`deck-refine proxy listening on 127.0.0.1:${PORT}`)
})
