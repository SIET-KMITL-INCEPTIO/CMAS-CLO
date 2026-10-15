import { buildApp } from "./app.js"
import { env } from "./lib/env.js"

const app = await buildApp()

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`Server running on port ${env.PORT}`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
