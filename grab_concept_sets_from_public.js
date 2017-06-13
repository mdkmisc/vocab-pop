require('isomorphic-fetch')
const _ = require('lodash')
const fs = require('fs')
const csets = []
const cs=fetch('http://api.ohdsi.org/WebAPI/conceptset/'
          ).then(r=>{
            if(r.status>=400){throw r}
            return r.json()
          }).then(
            csets=>_.sortBy(csets,d=>-d.id)
                      .slice(0,20)
                      .map(
                ({id,name})=>(
                  fetch(`http://api.ohdsi.org/WebAPI/conceptset/${id}/expression`
                       ).then(
                        r=>r.json()
                       ).then(
                        exp=>Object.assign({id,name},exp)
                       )
              )
            )
          ).then(
            promises=>Promise.all(promises).then(
              results=>fs.writeFileSync('csets.json',
                            JSON.stringify(results,null,2))
            )
          )
