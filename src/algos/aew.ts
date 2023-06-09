import { InvalidRequestError } from '@atproto/xrpc-server'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { Feed } from './feed_type'
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'aew' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

const AEW_ACCOUNTS = [
  'did:plc:dsmuyt6h5emct7b42qkum5dv', // aew.bsky.social
  'did:plc:kdugmwhfecul5277pxqwdxsa', // rjcity.bsky.social
  'did:plc:e2u3jd45hqntyueuucb42g74', // tonykhan.bsky.social
  'did:plc:khwlu6usc7lc2qzhdbvactg3', // willwashington.bsky.social
  'did:plc:odbt6gx5okqfvdqcwf72htbl', // iamjericho.bsky.social
]

const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .where('author', 'in', AEW_ACCOUNTS)
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const [indexedAt, cid] = params.cursor.split('::')
    if (!indexedAt || !cid) {
      throw new InvalidRequestError('malformed cursor')
    }
    const timeStr = new Date(parseInt(indexedAt, 10)).toISOString()
    builder = builder
      .where('post.indexedAt', '<', timeStr)
      .orWhere((qb) => qb.where('post.indexedAt', '=', timeStr))
      .where('post.cid', '<', cid)
  }
  const res = await builder.execute()

  const feed = res.map((row) => ({
    post: row.uri,
  }))

  logger.info(`🤖 aew feed generated ${feed.length} items`)
  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
  }

  return {
    cursor,
    feed,
  }
}

export const aew = new Feed(
  'aew',
  'All Elite Wrestling',
  'Accounts associated with All Elite Wrestling (AEW).',
  './public/images/all-elite-wrestling.jpg',
  handler,
)
