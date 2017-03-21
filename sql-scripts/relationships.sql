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
              )) as relcnts
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
                end as cdmcnts
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
  select  cdmcnts.*, 
          relcnts.relcids,
          relcnts.relcgids,
          relcnts.relcnts
  from cdmcnts -- shouldn't need left
  left join relcnts
    on cdmcnts.concept_id = relcnts.concept_id
  ;
alter table :results.concept_cnts add primary key (concept_id);

/* counts of related concepts and related concept groups
    for concept groups */
drop table if exists :results.grelcnts cascade;
create table :results.grelcnts as
with cnts as (
      select  rc.cgid,
              rc.relationship,
              rc.source,
              rc.da,
              rc.ih,
              min(rc.minlev) minlev,
              max(rc.maxlev) maxlev,
              count(distinct related_concept_id) relcids,
              count(distinct related_cgid) relcgids
      from related_concept rc
      /*
      where rc.concept_id in (8504, 8505, 44631062)
       */
      group by 1,2,3,4,5
    )
    select  cgid,
            sum(relcids) relcids,
            sum(relcgids) relgcids,
            json_agg((
              select row_to_json(_)
              from (
                  select  distinct
                          cnts.relationship,
                          cnts.source,
                          cnts.da,
                          cnts.ih,
                          cnts.minlev,
                          cnts.maxlev,
                          relcids,
                          relcgids
              ) as _
            )) as relcnts
    from cnts
    group by 1
;
alter table :results.grelcnts add primary key (cgid);

/* counts of cdm records for concept groups */
drop table if exists :results.gcdmcnts cascade;
create table :results.gcdmcnts as
        select  cgid,
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
                end as cdmcnts
        from results2.record_counts rc
        join results2.concept_group cg
           on   rc.domain_id = cg.domain_id and
                rc.standard_concept = cg.standard_concept and
                rc.vocabulary_id = cg.vocabulary_id and
                rc.concept_class_id = cg.concept_class_id
        --where rc.concept_id in (8504, 8505, 44631062, 44514581)
group by 1;
alter table :results.gcdmcnts add primary key (cgid);


drop table if exists :results.cgcnts cascade;
create table :results.gcnts as
  select  gcdmcnts.*, 
          grelcnts.relcids,
          grelcnts.relgcids,
          grelcnts.relcnts
  from gcdmcnts
  left join grelcnts
    on gcdmcnts.cgid = grelcnts.cgid
  ;
alter table :results.gcnts add primary key (cgid);

create or replace view concept_info as
  select
          cc.concept_id,
          cc.cgid,
          rc.concept_code,
          rc.concept_name,
          rc.domain_id,
          rc.standard_concept,
          rc.vocabulary_id,
          rc.concept_class_id,
          cc.cdmcnts,
          cc.relcids,
          cc.relcgids,
          cc.relcnts,
          cc.rc,
          cc.src,
          cc.crc
  from concept_cnts cc
  join record_counts rc on cc.concept_id = rc.concept_id
  ;

create or replace view related_concept_plus as
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
create index relcntidx on related_concept (cgid, relationship, source, da, ih, minlev, maxlev);


--select * from record_counts where concept_id in (8504, 8505, 44631062, 0);
select * from concept_group where cgid in (405, 115, 200);
select * from related_concept where concept_id in (8504, 8505, 44631062, 0);

--select * from relcnts where concept_id in (8504, 8505, 44631062, 0);
--select * from cdmcnts where concept_id in (8504, 8505, 44631062, 0);
select * from concept_cnts where concept_id in (8504, 8505, 44631062);

--select * from grelcnts limit 2;
--select * from gcdmcnts limit 2;
select * from gcnts limit 2;
select * from concept_info limit 2;
select * from related_concept_plus where concept_id in (8504, 8505, 44631062, 0);

