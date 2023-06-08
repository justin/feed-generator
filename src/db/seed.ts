import * as BlueSky from '@atproto/api'
import { AtpAgent } from '@atproto/api'
import { Database } from '../db'
import { Post } from './schema'
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
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
      actors: [
        'did:plc:zmjslothnwjtlsue36wznn77', // kredcarroll.bsky.london
        'did:plc:66elurdo7ngh7zfe4wrpjl7k', // rachelskirts.bsky.social
        'did:plc:2drlqjhjb3yq6efvddbiv72n', // lepinski.bsky.social
        'did:plc:nxvalqtnhkfhabdfqnafftee', // andersen.buzz
        'did:plc:ycwhasdjanzve7dvqf2ueeoe', // chrisrisner.com
        'did:plc:sefv7vq5yrt4t7fapgpao7kl', // pbur.bsky.social
        'did:plc:e3cyxeqboiqsybc3u6wvzysz', // edsbs.bsky.social,
        'did:plc:2v2yp5fsovvxa637d6upiz3d', // jb.wtf
        'did:plc:64ryvurqwzr6ljn5v7lwninh', // filmgirl.bsky.social

        // AEW
        'did:plc:dsmuyt6h5emct7b42qkum5dv', // aew.bsky.social
        'did:plc:kdugmwhfecul5277pxqwdxsa', // rjcity.bsky.social
        'did:plc:e2u3jd45hqntyueuucb42g74', // tonykhan.bsky.social
        'did:plc:khwlu6usc7lc2qzhdbvactg3', // willwashington.bsky.social
        'did:plc:odbt6gx5okqfvdqcwf72htbl', // iamjericho.bsky.social
      ],
    })

    if (!response.success) {
      throw new Error('Failed to get profiles')
    }

    const profiles = response.data
      .profiles as BlueSky.AppBskyActorDefs.ProfileViewDetailed[]

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
