
-- not sure how much faster this will perform than a view, might not be worth it
        -- does seem to make a big difference i think
--drop table if exists :results.ancestors;
create table :results.ancestors as
--create or replace view :results.ancestors as
  select a.ancestor_concept_id a_concept_id,
         a.descendant_concept_id d_concept_id,
         a.min_levels_of_separation,
         a.max_levels_of_separation,
         ca.domain_id as a_domain_id,
         ca.standard_concept as a_standard_concept,
         ca.vocabulary_id as a_vocabulary_id,
         ca.concept_class_id as a_concept_class_id,
         ca.concept_name as a_concept_name,
         cd.domain_id as d_domain_id,
         cd.standard_concept as d_standard_concept,
         cd.vocabulary_id as d_vocabulary_id,
         cd.concept_class_id as d_concept_class_id,
         cd.concept_name as d_concept_name
  from :cdm.concept_ancestor a
  join :cdm.concept ca on a.ancestor_concept_id = ca.concept_id and ca.invalid_reason is null
  join :cdm.concept cd on a.descendant_concept_id = cd.concept_id and cd.invalid_reason is null
  where ancestor_concept_id = descendant_concept_id;
create index anc1idx on :results.ancestors (a_concept_id);
create index anc2idx on :results.ancestors (d_concept_id);


/* 
NOT USING ANYMORE

  ancestor_plus_mapsto
    extended version of concept_ancestor table including concept_relationship
    'maps to' relationships and a single field telling which table the record
    came from and, if it came from concept_ancestor, the min and max separation
*/
/*
drop table :results.ancestor_plus_mapsto;
create table :results.ancestor_plus_mapsto as
  select
          'ca ' || min_levels_of_separation || '-' 
                || max_levels_of_separation as min_max,
          'ca ' || min_levels_of_separation as source,
          ca.descendant_concept_id,
          ca.ancestor_concept_id
  from :cdm.concept_ancestor ca
  -- left join to cr is not necessary when min_levels_of_separation < 2
  left join :cdm.concept_relationship cr on cr.relationship_id = 'Maps to'
        and ((ca.ancestor_concept_id = cr.concept_id_2 and ca.descendant_concept_id = cr.concept_id_1)
          or (ca.ancestor_concept_id = cr.concept_id_1 and ca.descendant_concept_id = cr.concept_id_2))
  where ca.ancestor_concept_id != ca.descendant_concept_id 
            --and min_levels_of_separation < 2
    and cr.concept_id_1 is null
  union
  select  
          '' as min_max,
          'cr_mapsto' as source,
          cr.concept_id_1,
          cr.concept_id_2
  from :cdm.concept_relationship cr
  where cr.relationship_id = 'Maps to'
    and cr.invalid_reason is null
    and cr.concept_id_1 != cr.concept_id_2 ;
create unique index apmidx on :results.ancestor_plus_mapsto (ancestor_concept_id,descendant_concept_id);

drop table if exists :results.ancestors;
create table :results.ancestors as
  select a.*,
         ca.domain_id as a_domain_id,
         ca.standard_concept as a_standard_concept,
         ca.vocabulary_id as a_vocabulary_id,
         ca.concept_class_id as a_concept_class_id,
         ca.concept_level as a_concept_level,
         ca.concept_name as a_concept_name,
         cd.domain_id as d_domain_id,
         cd.standard_concept as d_standard_concept,
         cd.vocabulary_id as d_vocabulary_id,
         cd.concept_class_id as d_concept_class_id,
         cd.concept_level as d_concept_level,
         cd.concept_name as d_concept_name
  from :results.ancestor_plus_mapsto a
  join :cdm.concept ca on a.ancestor_concept_id = ca.concept_id
  join :cdm.concept cd on a.descendant_concept_id = cd.concept_id;
create index anc1idx on :results.ancestors (ancestor_concept_id);
create index anc2idx on :results.ancestors (descendant_concept_id);
*/

/*
create table :results.domain_ancestors as
  select  c1.domain_id ancestor_domain_id,
          c2.domain_id descendant_domain_id,
          apm.source,
          count(*) cc
  from ancestor_plus_mapsto apm 
  join :cdm.concept c1 on apm.ancestor_concept_id=c1.concept_id 
  join :cdm.concept c2 on apm.descendant_concept_id=c2.concept_id 
  group by 3,1,2 
  order by 3,1,2;

-- same as above except counts:  (not sure which ones are right if any)
drop table :results.anc_groups;
create table :results.anc_groups as
  select  cg.vals[2] adom, 
          cg.vals[1] as asc,
          cg.vals[3] avoc,
          cg.vals[4] aclass,
          dcg.vals[1] ddom, 
          dcg.vals[2] as dsc,
          dcg.vals[3] dvoc,
          dcg.vals[4] dclass,
          array_unique(array_agg(cg.cgid)) cgids,
          array_unique(array_agg(dcg.dcid_grp_id)) dcgids, 
          sum(cc) cc, sum(dcg.dcc) dcc
  from concept_groups cg 
  left join dcid_cnts_breakdown dcg on cg.cgid = any(dcg.cgids) and dcg.grp=7 
  where cg.grp = 7 
  group by 1,2,3,4,5,6,7,8;

select  adom, 
        array_unique(array_agg(ddom)) ddoms,
        array_unique(array_agg(ag.asc)) ascs,
        array_unique(array_agg(dsc)) dscs,
        array_unique(array_agg(avoc)) avocs,
        array_unique(array_agg(dvoc)) dvocs,
        array_unique(array_agg(aclass)) aclasses,
        array_unique(array_agg(dclass)) dclasses,
        array_unique(array_cat_agg(cgids)) cgids,
        array_unique(array_cat_agg(dcgids)) dcgids,
        sum(cc) cc,
        sum(dcc) dcc
from anc_groups ag
group by 1 
order by coalesce(array_length(array_remove(array_unique(array_agg(ddom)),null),1),0), 1;

*/
