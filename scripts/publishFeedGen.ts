import dotenv from 'dotenv'
import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'
import { aew } from '../src/algos/aew'
import { mustSee } from '../src/algos/must-see'
import { Feed } from '../src/algos/feed_type'

async function publishFeed(agent: AtpAgent, feedGenDid: string, feed: Feed) {
  try {
    await agent.api.app.bsky.feed.describeFeedGenerator()
  } catch (err) {
    throw new Error(
      'The bluesky server is not ready to accept published custom feeds yet',
    )
  }

  let avatarRef: BlobRef | undefined
  if (feed.avatar) {
    let encoding: string
    if (feed.avatar.endsWith('png')) {
      encoding = 'image/png'
    } else if (feed.avatar.endsWith('jpg') || feed.avatar.endsWith('jpeg')) {
      encoding = 'image/jpeg'
    } else {
      throw new Error('expected png or jpeg')
    }
    const img = await fs.readFile(feed.avatar)
    const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
      encoding,
    })
    avatarRef = blobRes.data.blob
  }

  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: feed.shortName,
    record: {
      did: feedGenDid,
      displayName: feed.displayName,
      description: feed.description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
    },
  })
}

const run = async () => {
  dotenv.config()

  // YOUR bluesky handle
  // Ex: user.bsky.social
  const handle = process.env.BSKY_USERNAME!

  // YOUR bluesky password, or preferably an App Password (found in your client settings)
  // Ex: abcd-1234-efgh-5678
  const password = process.env.BSKY_PASSWORD!

  const feeds: Feed[] = [aew, mustSee]

  // -------------------------------------
  // NO NEED TO TOUCH ANYTHING BELOW HERE
  // -------------------------------------

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }
  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`

  // only update this if in a test environment
  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: handle, password })

  for (const feed of feeds) {
    await publishFeed(agent, feedGenDid, feed)
  }

  console.log('All done 🎉')
}

run()
