import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { mustSee } from './must-see'
import { aew } from './aew'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [mustSee.shortName]: mustSee.handler,
  [aew.shortName]: aew.handler,
}

export default algos
