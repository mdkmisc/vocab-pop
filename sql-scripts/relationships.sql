create table conceptRecord as
        select  concept_id,
                concept_code,
                concept_name,
                domain_id,
                standard_concept,
                vocabulary_id,
                concept_class_id,
                array_agg((
                  select row_to_json(_)
                  from (select rc.tbl, rc.col, rc.coltype, rc.rc, rc.src) as _
                )) as rcs
        from :results.record_counts rc
        group by 1,2,3,4,5,6,7;
create index rccidx on :results.conceptRecord (concept_id);
create index rccodedx on :results.conceptRecord (concept_code);
create index rcnameidx on :results.conceptRecord (concept_name);


create table :results.relatedConcepts as
select          cr.concept_id_1 base_concept_id,
                r.defines_ancestry,
                r.is_hierarchical,
                r.relationship_id,
                r.relationship_name,
                r.reverse_relationship_id,

                c.*

                from :cdm.concept_relationship cr
                join :cdm.relationship r
                      on cr.relationship_id=r.relationship_id
                join :results.conceptRecord c
                      on cr.concept_id_2 = c.concept_id

                where cr.invalid_reason is null
                  and cr.concept_id_2 != cr.concept_id_1

                order by relationship_name, domain_id, standard_concept,
                          vocabulary_id, concept_class_id, concept_name
                          ;
create index ridx on :results.conceptRelationship (base_concept_id);
