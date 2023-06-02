import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

export class Feed {
  shortName: string
  displayName: string
  description: string
  avatar: string
  handler: AlgoHandler

  constructor(
    shortName: string,
    displayName: string,
    description: string,
    avatar: string,
    handler: AlgoHandler,
  ) {
    this.shortName = shortName
    this.displayName = displayName
    this.description = description
    this.avatar = avatar
    this.handler = handler
  }
}
