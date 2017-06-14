const _ = require('./src/supergroup')
const fs = require('fs')

const explodeArrayFld = (rec,fname,pname='p') => 
  (rec[fname]||[]).map(subrec=>
    Object.assign({},
        _.mapKeys(rec, (v,k) => `${pname}_${k}`),
        (_.isObject(subrec) ? subrec : {[fname]:subrec})))
  
// rename below, sounds like the fields is plural, not the recs
const explodeArrayFlds = 
  (recs,fname,pname) => 
    _.flatten(recs.map(rec=>explodeArrayFld(rec,fname,pname)))



const csetj = fs.readFileSync('csets.json')
const csets = JSON.parse(csetj)
console.log('csets', csets.length)

const css = explodeArrayFlds(csets,'items')
const css2 = css.map( cs=> {
  _.extend(cs, cs.concept)
  delete cs.concept
  delete cs.p_items
  return cs
})

console.log('css', css.length)
console.log('css2', css.length)
//console.log(css[0])
//console.log(css2.slice(0,5))

const byExc = _.supergroup(
  css2,
  ['isExcluded','includeDescendants','includeMapped','p_name']
  //['p_name','includeDescendants','includeMapped','isExcluded']
  //['p_name','isExcluded','includeDescendants','includeMapped']
)
//const weird = byExc.filter(d=>d.children.length!==1)
//console.log(weird.map(d=>d.leafNodes()+''))
console.log(byExc.summary())
//console.log(byExc.leafNodes().namePaths())
