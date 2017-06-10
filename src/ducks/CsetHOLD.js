
export const selectMethods = [
  {
    name: 'Match concept name (in specific vocabulary for now)',
    matchBy: 'text',
    //params: {vocabulary_id:'ICD9CM', matchStr: 'acne'},
    params: {vocabulary_id:'string', matchStr: 'string'},
  },
  {
    name: 'Match concept codes',
    matchBy: 'codes',
    //params: {vocabulary_id:'ICD9CM', matchStr: '702%, 700%'},
    params: {vocabulary_id:'string', matchStr: 'string'},
  },
  {
    name: 'Concept code list',
    //params: {vocabulary_id:'ICD9CM', codes: ['702', '702.0', '702.01']}
    params: {vocabulary_id:'string', codes: 'string[]' }
  },
  {
    name: 'Concept ID list',
    //params: {cids: [8504,8505,44833364,44820047]},
    params: {cids: 'number[]'},
  },
]

export class Cset { // another stab at ConceptSet...should replace ConceptSet below when ready
  /*  for use in Concept component for passing around concepts and
   *  meta data. not for use in store or selectors!
   *
   *  maybe, no methods that change any state anywhere, all read-only
   */
  constructor(cset) {
    this._cset = cset
  }
  id = () => this._cset.id
  name = () => this._cset.name
  selectMethodName = () => this._cset.selectMethodName
  selectMethod = () => _.find(selectMethods, m=>m.name===this.selectMethodName()) || {}
  paramsNeeded = () => this.selectMethod().params || {}
  needsParam = (name) => this.paramsNeeded()[name]
  selectMethodParams = () => this._cset.selectMethodParams || {}
  param = (name) => this.selectMethodParams()[name]
  includeDescendants = () => this._cset.includeDescendants
  includeMapped = () => this._cset.includeMapped
  exExcluded = () => this._cset.exExcluded
  isSaved = () => this._cset.isSaved
  obj = () => this._cset
  serialize = () => {
    return JSON.stringify(this.obj())
  }
  cids = () => this.selectMethod(this.selectMethodParams())
  cidCnt = () => this.cids().length
  getTheJunk = () => ({
    matchBy: this.selectMethod().matchBy,
    vocabulary_id: this.param('vocabulary_id'), 
    matchStr: this.param('matchStr')
  })
  valid = () => {
    let {vocabulary_id, matchBy, matchStr} = this.getTheJunk()
    return vocabulary_id && matchBy && matchStr
  }
}
