# vocab-pop
## OHDSI Vocabulary / Population Browser

You'll need a Postgres OHDSI CDM and https://github.com/Sigfried/ohdsi-api

And change settings in src/config.js appropriately

then `npm i`

and `npm start`
or `npm run build`




  - overall goals:
    - make individual OHDSI vocabularies more approachable
    - facilitate understanding of OHDSI's vocabularies and concepts, relationships between them, and their prevelance in a specific CDM
    - facilitate translation from individual source concepts for cohort or phenotype definition and for ETL work
    - facilitate development or translation of concept sets
    - provide tools and interface for classification/granularity selection in other contexts (e.g., patient profiles)
    - towards these ends: 
      - develop detailed requirements, designs, and prototypes
      - implement in ATLAS if and when resources are available
  - use cases:
    - define a cohort or phenotype (needed by ATLAS users):
      - translate existing phenotype definition (e.g., set of ICD-9 codes for some condition) from a source vocabulary into a target vocabulary
    - explore the whole set of OHDSI vocabularies:
      - needed in Athena
      - to improve and debug the vocabularies
      - in general
      - only for concepts in user's CDM
      - for a specific domain:
        - e.g., provider specialty, show record counts for all values including zero counts for specialties not used; maybe also show corresponding source values and source values that weren't able to be mapped to a target. (provider.specialty_concept_id, provider.specialty_source_value, provider.specialty_source_concept_id, care_site.specialty_concept_id, care_site.specialty_source_value)
      - to better understand relationships between source and target domains
      - to better understand classifications available
    - source(s) to target(s):
      - find mapped or matching codes, classification or standard
      - in target code(s) selected, see which source codes are added or left out and counts of corresponding patient records
    - find a concept:
      - have immediate feedback on CDM records with concept
      - see relationships to other concepts and be encouraged to assure one has chosen correctly
    - explore my popupaltion:
      - overall
      - in terms of some domain
      - defining a subpopulation (same as 1)
      - intersecion of subpopulations
    - Patrick's SNOMED navigation strategy: 
      - using related concepts filter on Class, choose Has ancestor of from Relationship facet, filter on Distance facet
    - compare vocabulary version as per [http://forums.ohdsi.org/t/new-vocabulary-population-visualization-working-group/2187/17?u=sigfried_gold](Peter's post)
  - notes and to-dos:
    - other systems to get ideas from:
      - http://outins.com/
      - http://jigsaw.io/
      - http://www.ephir.com/
      - http://www.aviz.fr/Research/Nodetrix
    - javascript libraries to consider using:
      - https://www.golden-layout.com/examples/
    - to-dos:
      - integrate ERD maybe:
        - http://www.ohdsi.org/web/wiki/lib/exe/fetch.php?media=documentation:omop_cdm_v5_erd.pdf
      - source record count:
        - show these as existing in cdm but not available through query
        - also show ancestor concepts with their descendant record counts
        - only show classification concepts that have a descendant record count
      - default to showing 4 main domains (condition, drug, procedure, measurement)
