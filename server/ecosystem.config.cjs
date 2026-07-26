module.exports = {
  apps: [
    {
      name: 'hamantis-deck-refine',
      script: 'server/deck-refine.mjs',
      cwd: __dirname + '/..',
      env: {
        DECK_REFINE_PORT: 8791,
      },
    },
  ],
}
