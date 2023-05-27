import { InvalidRequestError } from '@atproto/xrpc-server'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

export const uri =
  'at://did:plc:ovd4yosoobsdxwmay46wzhwx/app.bsky.feed.generator/must-see'

const MUST_SEE_ACCOUNTS = [
  'did:plc:uashgn65n5z7aqwk5cbuba5c', // kredcarroll.bsky.london
  'did:plc:66elurdo7ngh7zfe4wrpjl7k', // rachelskirts.bsky.social
  'did:plc:uashgn65n5z7aqwk5cbuba5c', // lepinski.bsky.social
  'did:plc:nxvalqtnhkfhabdfqnafftee', // andersen.buzz
  'did:plc:ycwhasdjanzve7dvqf2ueeoe', // chrisrisner.com
  'did:plc:sefv7vq5yrt4t7fapgpao7kl', // pbur.bsky.social
  'did:plc:e3cyxeqboiqsybc3u6wvzysz', // edsbs.bsky.social,
  'did:plc:2v2yp5fsovvxa637d6upiz3d', // jb.wtf
  'did:plc:64ryvurqwzr6ljn5v7lwninh', // filmgirl.bsky.social
]

export const handler = async (ctx: AppContext, params: QueryParams) => {
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
