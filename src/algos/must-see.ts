import { InvalidRequestError } from '@atproto/xrpc-server'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { Feed } from './feed_type'
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'must-see' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})
const MUST_SEE_ACCOUNTS = [
  'did:plc:zmjslothnwjtlsue36wznn77', // kredcarroll.bsky.london
  'did:plc:66elurdo7ngh7zfe4wrpjl7k', // rachelskirts.bsky.social
  'did:plc:2drlqjhjb3yq6efvddbiv72n', // lepinski.bsky.social
  'did:plc:nxvalqtnhkfhabdfqnafftee', // andersen.buzz
  'did:plc:ycwhasdjanzve7dvqf2ueeoe', // chrisrisner.com
  'did:plc:sefv7vq5yrt4t7fapgpao7kl', // pbur.bsky.social
  'did:plc:e3cyxeqboiqsybc3u6wvzysz', // edsbs.bsky.social,
  'did:plc:2v2yp5fsovvxa637d6upiz3d', // jb.wtf
  'did:plc:64ryvurqwzr6ljn5v7lwninh', // filmgirl.bsky.social
  'did:plc:mmaqcbxi5cfco4o476lm7ah5', // tdf.bsky.social
  'did:plc:izuwp3undw3ftet5lxeu4nbs', // drance.bsky.social
  'did:plc:zlzbhkpioummfuyfhbzrluuz', // marion.bsky.social
]

const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .where('author', 'in', MUST_SEE_ACCOUNTS)
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

  logger.info(`🤖 must-see feed generated ${feed.length} items`)
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

export const mustSee = new Feed(
  'must-see',
  'Must See',
  'A feed of my must see skeeters.',
  './public/images/must-see.png',
  handler,
)
