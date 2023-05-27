import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

const dids = [
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

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // for (const post of ops.posts.creates) {
    //   console.log(post.author)
    // }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // Only keep posts from the users we care about.
        return dids.includes(create.author)
      })
      .map((create) => {
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    postsToCreate.forEach((post) => {
      console.log(post.uri)
    })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
