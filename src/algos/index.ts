import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as mustSee from './must-see'
import * as aew from './aew'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [mustSee.uri]: mustSee.handler,
  [aew.uri]: aew.handler,
}

export default algos
