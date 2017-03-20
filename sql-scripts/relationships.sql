/*
drop table if exists :results.concept_record cascade;
create table :results.concept_record as
        select  concept_id,
                concept_code,
                concept_name,
                domain_id,
                standard_concept,
                vocabulary_id,
                concept_class_id,
                null::int as cgid,
                sum(rc) rc,
                sum(src) src,
                sum(crc) crc,
                json_agg((
                  select row_to_json(_)
                  from (
                    select  rc.tbl, rc.col, rc.coltype, 
                            rc.rc, rc.src) as _
                )) as rcs
        from :results.record_counts rc
        group by 1,2,3,4,5,6,7,8;
alter table :results.concept_record add primary key (concept_id);
--create index rccidx on :results.concept_record (concept_id);
create index rccodedx on :results.concept_record (concept_code);
create index rcnameidx on :results.concept_record (concept_name);
create index rcgrpidx on :results.concept_record 
  (domain_id, standard_concept, vocabulary_id, concept_class_id);
*/

drop table if exists :results.concept_group;
create table :results.concept_group (
                cgid serial primary key,
                domain_id varchar(20),
                standard_concept varchar(1),
                vocabulary_id varchar(20),
                concept_class_id varchar(20),
                cc int,
                rc int,
                src int,
                crc int);

insert into :results.concept_group( domain_id,
                                    standard_concept,
                                    vocabulary_id,
                                    concept_class_id,
                                    cc, rc, src, crc)
    select  domain_id,
            standard_concept,
            vocabulary_id,
            concept_class_id,
            count(*) cc,
            sum(rc) rc,
            sum(src) src,
            sum(crc) crc
    from :results.record_counts cr
    group by 1,2,3,4;

update :results.concept_record cr
set cgid = cg.cgid
from :results.concept_group cg
where   cr.domain_id = cg.domain_id and
        cr.standard_concept = cg.standard_concept and
        cr.vocabulary_id = cg.vocabulary_id and
        cr.concept_class_id = cg.concept_class_id

drop table if exists :results.related_concept;
create table :results.related_concept as
select          cr.concept_id_1 as concept_id,
                crec.cgid,
                'cr' as source,
                r.relationship_id relationship,
                r.defines_ancestry as da,
                r.is_hierarchical as ih,
                null as minlev,
                null as maxlev,
                cr.concept_id_2 as related_concept_id,
                crecrel.cgid as related_cgid
                from :cdm.concept_relationship cr
                join :cdm.relationship r
                      on cr.relationship_id=r.relationship_id
                join :results.concept_record crec
                      on cr.concept_id_1 = crec.concept_id
                join :results.concept_record crecrel
                      on cr.concept_id_2 = crecrel.concept_id
                where cr.invalid_reason is null
                  and cr.concept_id_2 != cr.concept_id_1
union
select          ca.ancestor_concept_id as concept_id,
                crec.cgid,
                'caa' as source,
                'ancestor' as relationship,
                null as da,
                null as ih,
                ca.min_levels_of_separation as minlev,
                ca.max_levels_of_separation as maxlev,
                ca.descendant_concept_id as related_concept_id,
                crecrel.cgid as related_cgid
                from :cdm.concept_ancestor ca
                join :results.concept_record crec
                      on ca.ancestor_concept_id = crec.concept_id
                join :results.concept_record crecrel
                      on ca.descendant_concept_id = crecrel.concept_id
                where ca.ancestor_concept_id != ca.descendant_concept_id
union
select          cd.descendant_concept_id as concept_id,
                crec.cgid,
                'cad' as source,
                'descendant' as relationship,
                null as da,
                null as ih,
                cd.min_levels_of_separation as minlev,
                cd.max_levels_of_separation as maxlev,
                cd.ancestor_concept_id as related_concept_id,
                crecrel.cgid as related_cgid
                from :cdm.concept_ancestor cd
                join :results.concept_record crec
                      on cd.descendant_concept_id = crec.concept_id
                join :results.concept_record crecrel
                      on cd.ancestor_concept_id = crecrel.concept_id
                where cd.descendant_concept_id != cd.ancestor_concept_id
                          ;
create index rccidx on related_concept (concept_id);
create index rccgidx on related_concept (cgid);
create index rcrelidx on related_concept (relationship);
alter table :results.related_concept 
  add primary key (concept_id,relationship,related_concept_id);

/* counts of related concepts and related concept groups, 1 rec for each concept */
drop table if exists :results.relcnts cascade;
create table :results.relcnts as
      select  rc.concept_id, 
              count(distinct related_concept_id) relcids, 
              count(distinct related_cgid) relcgids,
              json_agg((
                select row_to_json(_)
                from (
                  select  rc.relationship, 
                          rc.source,
                          rc.da,
                          rc.ih,
                          rc.minlev,
                          rc.maxlev,
                          related_concept_id,
                          related_cgid
                ) as _
              )) as _relcnts
      from related_concept rc --where rc.concept_id in (8504, 8505, 44631062)
      group by 1;
alter table :results.relcnts add primary key (concept_id);

/* counts of cdm records, 1 rec for each concept */
drop table if exists :results.cdmcnts cascade;
create table :results.cdmcnts as
        select  concept_id, cgid,
                sum(rc.rc) rc,
                sum(rc.src) src,
                sum(rc.crc) crc,
                case when sum(rc.rc) > 0 or sum(rc.src) > 0 or sum(rc.crc) > 0 then
                  json_agg((
                    select row_to_json(_)
                    from (
                      select  rc.tbl, rc.col, rc.coltype,
                              rc.rc, rc.src, rc.crc
                      where rc.rc > 0 or rc.src > 0 or rc.crc > 0
                    ) as _
                  ))
                  else to_json(ARRAY[]::json[])
                end as cdmcnts,
                sum(cg.rc) cgrc,
                sum(cg.src) cgsrc,
                sum(cg.crc) cgcrc
        from results2.record_counts rc
        join results2.concept_group cg
           on   rc.domain_id = cg.domain_id and
                rc.standard_concept = cg.standard_concept and
                rc.vocabulary_id = cg.vocabulary_id and
                rc.concept_class_id = cg.concept_class_id
        --where rc.concept_id in (8504, 8505, 44631062, 44514581)
group by 1,2;
alter table :results.cdmcnts add primary key (concept_id);

drop table if exists :results.concept_cnts cascade;
create table :results.concept_cnts as
  select  relcnts.*, 
          cdmcnts.rc,
          cdmcnts.src,
          cdmcnts.crc,
          cdmcnts.cdmcnts
  from relcnts
  left join cdmcnts -- shouldn't need left
    on relcnts.concept_id = cdmcnts.concept_id
  ;
alter table :results.concept_cnts add primary key (concept_id);



select * from record_counts limit 2;
select * from concept_group limit 2;
select * from related_concept limit 2;
select * from relcnts limit 2;
select * from cdmcnts limit 2;
select * from concept_cnts limit 2;



-- maybe skip those two and combine them in:
create or replace view concept_info as

-- deal with concept groups

select cgid, related_cgid, relationship, 
       count(distinct concept_id) cids, 
       count(distinct related_concept_id) relcids 
from related_concept group by 1,2,3 limit 5;
/*
+------+--------------+--------------+------+---------+
| cgid | related_cgid | relationship | cids | relcids |
+------+--------------+--------------+------+---------+
|    1 |            4 | HOI - MedDRA |    8 |       6 |
|    1 |            5 | HOI - MedDRA |   50 |     241 |
|    1 |            8 | ancestor     |   43 |    4935 |
|    1 |            8 | HOI - SNOMED |   43 |     485 |
|    1 |           41 | HOI - SNOMED |    2 |       8 |
+------+--------------+--------------+------+---------+
*/


create or replace view related_concept_all as
  select
          rc.concept_id,
          rc.cgid,
          rc.source,
          rc.relationship,
          rc.da,
          rc.ih,
          rc.minlev,
          rc.maxlev,
          rc.related_concept_id,
          rc.related_cgid,

          cr.concept_code,
          cr.concept_name,
          cr.domain_id,
          cr.standard_concept,
          cr.vocabulary_id,
          cr.concept_class_id,
          cr.rc,
          cr.src,
          cr.crc,
          cr.rcs,

          crr.concept_code as rel_concept_code,
          crr.concept_name as rel_concept_name,
          crr.domain_id as rel_domain_id,
          crr.standard_concept as rel_standard_concept,
          crr.vocabulary_id as rel_vocabulary_id,
          crr.concept_class_id as rel_concept_class_id,
          crr.rc as rel_rc,
          crr.src as rel_src,
          crr.crc as rel_crc,
          crr.rcs as rel_rcs
  from related_concept rc
  join concept_record cr on rc.concept_id = cr.concept_id
  join concept_record crr on rc.related_concept_id = crr.concept_id
  ;
  

/*
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
                join :results.concept_record c
                      on cr.concept_id_2 = c.concept_id

                where cr.invalid_reason is null
                  and cr.concept_id_2 != cr.concept_id_1

                order by relationship_name, domain_id, standard_concept,
                          vocabulary_id, concept_class_id, concept_name
                          ;
create index ridx on :results.conceptRelationship (base_concept_id);
*/
