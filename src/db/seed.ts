import * as BlueSky from '@atproto/api'
import { AtpAgent } from '@atproto/api'
import { Database } from '../db'
import { Post } from './schema'
import winston from 'winston'
import { MUST_SEE_ACCOUNTS } from '../algos/must-see'
import { AEW_ACCOUNTS } from '../algos/aew'

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

export const seedFeed = async (db: Database) => {
  const handle = process.env.BSKY_USERNAME!
  const password = process.env.BSKY_PASSWORD!

  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: handle, password })

  try {
    const response = await agent.api.app.bsky.actor.getProfiles({
        actors: [...MUST_SEE_ACCOUNTS, ...AEW_ACCOUNTS],
    })

    if (!response.success) {
      throw new Error('Failed to get profiles')
    }

    const profiles = response.data.profiles as BlueSky.AppBskyActorDefs.ProfileViewDetailed[]

    for (const profile of profiles) {
      const feed = await agent.api.app.bsky.feed.getAuthorFeed({
        actor: profile.did,
      })

      const posts = feed.data.feed as BlueSky.AppBskyFeedDefs.FeedViewPost[]

      let postsToCreate: Post[] = []
      for (const post of posts) {
        const postRecord = {
          uri: post.post.uri,
          cid: post.post.cid,
          replyParent: post.reply?.parent.uri ?? null,
          replyRoot: post.reply?.root.uri ?? null,
          indexedAt: post.post.indexedAt,
          author: post.post.author.did,
        } as Post

        postsToCreate.push(postRecord)
      }

      if (postsToCreate.length > 0) {
        await db
          .insertInto('post')
          .values(postsToCreate)
          .onConflict((oc) => oc.doNothing())
          .execute()
      }

      logger.info(`Seeded ${postsToCreate.length} posts for ${profile.did}`)
    }
  } catch (err) {
    logger.error(`Error seeding database: ${err.message}. ${err}`)
  }
}
