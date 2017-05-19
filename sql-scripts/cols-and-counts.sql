

/* generate a list of all CDM columns containing concept ids
    that should be counted in record counts:

          tbl           |    table_name     |          column_name          | column_type
------------------------+-------------------+-------------------------------+-------------
 cdm2.cohort_definition | cohort_definition | definition_type_concept_id    | type
 cdm2.cohort_definition | cohort_definition | subject_concept_id            | target
 cdm2.observation       | observation       | observation_concept_id        | target
 cdm2.observation       | observation       | observation_source_concept_id | source
 cdm2.observation       | observation       | observation_type_concept_id   | type
*/
create or replace view :results.cols_with_concept_ids as
  with cols as (
    select (table_schema||'.'||table_name)::regclass as tbl, 
              table_name,
              column_name::text as col
    from information_schema.columns 
    where
          table_schema = current_setting('my.vars.cdm') 
          and table_name not like '%concept%' 
          and table_name != 'fact_relationship' -- at least for now
          and (
                column_name like '%concept_id%' 
                --or column_name like '%source_value'
              )
  )
  select tbl, table_name, col as column_name,
            case 
              when col not like '%type%' and col not like '%source%' and
                   col not like 'qualifier%' and
                   col not like 'value%' and
                   col not like 'modifier%' and
                   col not like 'operator%' and
                   col not like 'range%' and
                   col not like 'priority%' and
                   col not like 'dose_unit%' and
                   col not like 'route%' and
                   col not like 'unit%' and
                   --col != 'specimen_source_value' and
                   --col != 'eff_drug_dose_source_value' and
                   col not like 'death_impute%'
                then 'target'
              when col like '%type%' then 'type'
              when col like '%source%' and col not like '%source_value' then 'source'
              --when col like '%source_value' then 'source_value'
              when col not like '%type%' and col not like '%source%' and (
                        col like 'qualifier%' or
                        col like 'value%' or
                        col like 'modifier%' or
                        col like 'operator%' or
                        col like 'range%' or
                        col like 'priority%' or
                        col like 'dose_unit%' or
                        col like 'route%' or
                        col like 'unit%' or
                        --col = 'specimen_source_value' or
                        --col = 'eff_drug_dose_source_value' or
                        col like 'death_impute%') then 'other'
            end as column_type
  from cols;

comment on view :results.cols_with_concept_ids is 'List of all CDM tables/columns with concept_ids, and a classification of what kind of column it is. Code in https://github.com/Sigfried/vocab-pop/blob/master/sql-scripts/cols-and-counts.sql';
/* the following table, function, query are used to generate record counts
    for each concept_id for each column it appears in:

 schema | table_name  |          column_name          | column_type | concept_id |  count
--------+-------------+-------------------------------+-------------+------------+---------
 cdm2   | observation | observation_concept_id        | target      |    4275495 |  553962
 cdm2   | observation | observation_concept_id        | target      |    3040464 |   91141
 cdm2   | observation | observation_concept_id        | target      |    4219336 |  554134
 cdm2   | observation | observation_concept_id        | target      |   44813951 | 9235879
 */
drop table if exists :results.concept_id_occurrence;
create table :results.concept_id_occurrence (
  --table_schema information_schema.sql_identifier,
  schema text,
  table_name text,
  column_name text,
  column_type text,
  concept_id integer,
  cnt bigint
);

CREATE OR REPLACE 
  FUNCTION :results.store_concept_id_counts(
              _schema text,
              _tbl text,
              _col text, 
              _col_type text,
              target_schema text,
              target_table text
            ) 
  RETURNS TABLE(
                  resultsSchema text,
                  cdmSchema text,
                  table_name text,
                  column_name text,
                  column_type text,
                  count bigint
                )
  AS
  $func$
  declare sql text;
  BEGIN
    RAISE NOTICE 'getting concept_ids for %.%s', _tbl, _col;
    sql := format(
      'INSERT INTO %s.%s ' ||                       -- target_schema, target_table, 
      'SELECT ' ||
      '       ''%s'' as schema, ' ||                -- _schema, 
      '       ''%s'' as table_name, ' ||            -- _tbl
      '       ''%s'' as column_name, ' ||           -- _col
      '       ''%s'' as column_type, ' ||           -- _coltype
      '       %s as concept_id, ' ||                -- _col
      '       count(*) as count ' ||
      'from (select * from %s.%s ' ||               -- _schema, _tbl
      '      where %s is not null ) t ' ||          -- _col
      --'from (select * from %s.%s limit 5) t ' ||
      --'where %s > 0 ' ||
      'group by 1,2,3,4,5',
        target_schema, target_table,
        _schema,
        _tbl,
        _col,
        _col_type,
        _col,
        _schema, _tbl,
        _col
      );
    RAISE NOTICE '%', sql;
    EXECUTE sql;
  END;
  $func$ LANGUAGE plpgsql;

select :results.store_concept_id_counts(
          schema::text,
          table_name::text,
          column_name::text,
          column_type::text,
          target_schema::text,
          target_table::text
) from
  (select current_setting('my.vars.cdm')::text as schema, 
          table_name,
          column_name,
          column_type,
          current_setting('my.vars.results')::text target_schema, 
          'concept_id_occurrence'::text target_table
    from :results.cols_with_concept_ids cc) x;
alter table :results.concept_id_occurrence add primary key (table_name, column_name, concept_id);
create index cio_idx1 on :results.concept_id_occurrence (concept_id);

/* get rid of concept counts for invalid concepts --
    revisit this, do we want these counts so we can report
    on invalid concepts appearing in the CDM? probably. but
    for now it just complicates things.
    (though some of the vocab-pop code assumes that there will be invalid
    concepts and allows them to be counted or filtered out)
*/

/* concept_record table
    combines counts with concept attributes from the concept table:
      domain, standard concept, vocabulary, concept class. (should
      also have invalid indicator, but see preceding comment.)

    includes a row for every concept, even when they have 0 counts,
    and more than one row if the concept appears in more than one
    column.

    converts standard_concept = null to 'X' because joins later on
    won't work on null values.

    has two count columns, one for standard_concept = 'S' (rc) 
    and one for others (C,X) (src)

    S concepts and columns marked as target should only have rc counts.
    X concepts and columns marked as source should only have src counts.
    C concepts shouldn't have any counts.

    where these rules are broken, there may have been a problem with ETL,
    or in the vocabularies

 concept_id |     domain_id      | standard_concept | vocabulary_id |  concept_class_id  |     tbl     |              col              | coltype | rc  | src
------------+--------------------+------------------+---------------+--------------------+-------------+-------------------------------+---------+-----+-----
   38001032 | Observation        | S                | DRG           | MS-DRG             | observation | observation_source_concept_id | source  |  64 |   0
   38000965 | Observation        | S                | DRG           | MS-DRG             | observation | observation_source_concept_id | source  | 171 |   0
   44777738 | Provider Specialty | S                | HES Specialty | HES Specialty      | observation | observation_source_concept_id | source  |   1 |   0
   45414607 | Drug               | X                | Multum        | Multum             | observation | observation_source_concept_id | source  |   0 |   2
   45941602 | Spec Anatomic Site | X                | CIEL          | Anatomy            | observation | observation_source_concept_id | source  |   0 |   2
   38001140 | Observation        | S                | DRG           | MS-DRG             | observation | observation_source_concept_id | source  |  35 |   0
   38000982 | Observation        | S                | DRG           | MS-DRG             | observation | observation_source_concept_id | source  | 141 |   0
   44777801 | Provider Specialty | S                | HES Specialty | HES Specialty      | observation | observation_source_concept_id | source  |   3 |   0
   44823089 | Condition          | X                | ICD9CM        | 3-dig nonbill code | observation | observation_source_concept_id | source  |   0 |   1
   38000092 | Condition          | C                | SMQ           | SMQ                | observation | observation_source_concept_id | source  |   1 |   0
*/

drop table if exists :results.concept_group;
create table :results.concept_group (
                cgid serial primary key,
                domain_id varchar(20),
                standard_concept varchar(1),
                vocabulary_id varchar(20),
                concept_class_id varchar(20),
                cc int, 
                cdmcnt int);

insert into :results.concept_group( domain_id,
                                    standard_concept,
                                    vocabulary_id,
                                    concept_class_id,
                                    cc, cdmcnt)
    select  domain_id,
            coalesce(standard_concept, 'X') standard_concept,
            vocabulary_id,
            concept_class_id,
            count(*) cc,
            sum(cnt) cdmcnt
    from :cdm.concept c
    left join :results.concept_id_occurrence cio on c.concept_id = cio.concept_id
    where c.invalid_reason is null
    group by 1,2,3,4;
alter table :results.concept_group add primary key (cgid);
create unique index cgidx on :results.concept_group (domain_id, standard_concept, vocabulary_id, concept_class_id);


drop type if exists :results.rcs;
create type :results.rcs as (tbl text, col text, coltype text, rc int, src int, crc int);

drop table if exists :results.concept_record cascade;
create table :results.concept_record as
  select  c.concept_id,
          cg.cgid,
          c.concept_code,
          c.concept_name,
          cg.domain_id,
          cg.standard_concept,
          cg.vocabulary_id,
          cg.concept_class_id,
          cio.rcs
  from :cdm.concept c
  join :results.concept_group cg on
          c.domain_id = cg.domain_id and
          coalesce(c.standard_concept,'X') = cg.standard_concept and
          c.vocabulary_id = cg.vocabulary_id and
          c.vocabulary_id = cg.vocabulary_id and
          c.concept_class_id = cg.concept_class_id
  left join (
    select concept_id,
          coalesce(standard_concept, 'X') standard_concept,
          array_agg(row(table_name, column_name, column_type, rc, src, crc)::rcs) rcs
      from (
        select  cio.*, c.standard_concept,
                coalesce(case when c.standard_concept = 'S' then cio.cnt else 0 end, 0) as rc,
                coalesce(case when c.standard_concept is null then cio.cnt else 0 end, 0) as src,
                coalesce(case when c.standard_concept = 'C' then cio.cnt else 0 end, 0) as crc
        from :results.concept_id_occurrence cio
        join :cdm.concept c on cio.concept_id = c.concept_id and c.invalid_reason is null
      ) x
      group by 1,2
  ) cio on c.concept_id = cio.concept_id
  where c.invalid_reason is null;

alter table :results.concept_record add primary key (concept_id);
create index rccodedx on :results.concept_record (concept_code);
create index rcnameidx on :results.concept_record (concept_name);
create index rcgrpidx on :results.concept_record (domain_id, standard_concept, vocabulary_id, concept_class_id);



drop table if exists :results.related_concept;
create table :results.related_concept as
select          cr.concept_id_1 as concept_id,
                crec.cgid,
                'cr'::varchar(10) as source,
                r.relationship_id relationship,
                r.defines_ancestry as da,
                r.is_hierarchical as ih,
                null::integer as minlev,
                null::integer as maxlev,
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
                  and cr.concept_id_2 != cr.concept_id_1;

insert into :results.related_concept
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
                where ca.ancestor_concept_id != ca.descendant_concept_id;

insert into :results.related_concept
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
                where cd.descendant_concept_id != cd.ancestor_concept_id ;

alter table :results.related_concept 
  add primary key (concept_id,relationship,related_concept_id);
alter index related_concept_pkey rename to pkey_related_concept; -- just to get rid of annoying auto complete in psql
--create index rccidx on :results.related_concept (concept_id);
create index rccgidx on :results.related_concept (cgid);
create index rcrelidx on :results.related_concept (relationship);



/* counts of related concepts and related concept groups, 1 rec for each concept */
drop table if exists :results.relcnts cascade;
create table :results.relcnts as
  with percid as (
    select    rc.concept_id,
              rc.cgid,
              rc.source,
              rc.relationship,
              rc.da,
              rc.ih,
              rc.related_cgid, cg.domain_id, cg.standard_concept, cg.vocabulary_id, cg.concept_class_id,
              min(rc.minlev) minlev,
              max(rc.maxlev) maxlev,
              count(distinct related_concept_id) relcidcnt
          from :results.related_concept rc
          join concept_group cg on rc.related_cgid = cg.cgid
          --where concept_id = 138225
          group by 1,2,3,4,5,6,7,8,9,10,11
          order by 1,2,3,4,5,6,7,8,9,10,11
  )
  select  concept_id, cgid,
          json_agg((
            select row_to_json(_)
            from (
              select  related_cgid,
                      domain_id, 
                      standard_concept, 
                      vocabulary_id, 
                      concept_class_id,
                      source,
                      relationship,
                      da,
                      ih,
                      minlev,
                      maxlev,
                      relcidcnt
            ) as _
          )) relgrps
  from percid
  group by 1,2;
alter table :results.relcnts add primary key (concept_id);
create index idx_relcntscgid on :results.relcnts (cgid);


/*    not using concept_info, at least at the moment...have an api call (conceptInfo) that does it
drop table if exists :results.concept_info cascade;
create table :results.concept_info as
  select
          cr.cgid,
          cr.concept_name,
          cr.concept_code,
          cr.domain_id,
          cr.standard_concept,
          cr.vocabulary_id,
          cr.concept_class_id,
          rct.relgrps,
          ci.*
  from :results.concept_record cr
  join (
        select  cr.concept_id,
                coalesce(sum((rcsr).rc),0) rc,
                coalesce(sum((rcsr).src),0) src,
                coalesce(sum((rcsr).crc),0) crc,
                json_array_no_null(json_agg(row_to_json(rcsr))) rcs
        from :results.concept_record cr
        left join lateral unnest(cr.rcs) rcsr on true
        --where concept_id = 44826853
        --where cr.concept_id in (40221875,917910,19031854,19029814,19121752,40169747,19019693,19028938,1750196,40172391,138225)
        group by 1
      ) ci on cr.concept_id = ci.concept_id
  left join relcnts rct on cr.concept_id = rct.concept_id;

alter table :results.concept_info add primary key (concept_id);
*/

/*
create or replace view :results.related_concept_plus as
  select
          rc.concept_id,
          rc.cgid,
          rc.related_concept_id,
          rc.related_cgid,
          rc.source,
          rc.relationship,
          rc.da,
          rc.ih,
          rc.minlev,
          rc.maxlev,

          cr.concept_code, -- rest refers to related concept
          cr.concept_name,
          cr.domain_id,
          cr.standard_concept,
          cr.vocabulary_id,
          cr.concept_class_id,
          cr.rcs
  from :results.related_concept rc
  join :results.concept_record cr on rc.related_concept_id = cr.concept_id
  ;
--alter table :results.related_concept_plus add primary key (concept_id,relationship,related_concept_id);

/*
create or replace view :results.related_concept_plus as
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
  from :results.related_concept rc
  join :results.concept_record cr on rc.concept_id = cr.concept_id
  join :results.concept_record crr on rc.related_concept_id = crr.concept_id
  ;
--alter table :results.related_concept_plus add primary key (concept_id,relationship,related_concept_id);
select * from :results.relcnts where concept_id in (8504, 8505, 44631062, 0);
select * from :results.cdmcnts where concept_id in (8504, 8505, 44631062, 0);
select * from :results.related_concept_plus where concept_id in (8504, 8505, 44631062, 0);
*/
analyze; -- this probably needs to be run by ohdsi_admin_user


select * from :results.concept_record where concept_id in (8504, 8505, 44631062, 0);
select * from :results.concept_group where cgid in (405, 115, 200);
select * from :results.related_concept where concept_id in (8504, 8505, 44631062, 0);


/*
select * from :results.concept_info limit 2;
 */



/*
    i might need this stuff, but not using yet
/* counts of related concepts and related concept groups
    for concept groups * /
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
      from :results.related_concept rc
      /*
      where rc.concept_id in (8504, 8505, 44631062)
       * /
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

/* counts of cdm records for concept groups * /
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
        from :results.record_counts rc
        join :results.concept_group cg
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
  from :results.gcdmcnts
  left join grelcnts
    on gcdmcnts.cgid = grelcnts.cgid
  ;
select * from :results.grelcnts limit 2;
select * from :results.gcdmcnts limit 2;
alter table :results.gcnts add primary key (cgid);
select * from :results.gcnts limit 2;

*/


/* record_counts_agg
    groups by all the attribute columns we have and aggregates counts
    and includes an array of all concept ids in each groups */
/* not using now, right?
drop table if exists :results.record_counts_agg;
create table :results.record_counts_agg as
  select
        row_number() over () as rcgid, -- could link concept_groups_w_cids back to here, but no need
                                       -- so no need for this id
        domain_id, 
        standard_concept, 
        vocabulary_id, 
        concept_class_id, 
        tbl, 
        col, 
        coltype,
        count(distinct concept_id)::integer cc,
        sum(rc) rc,
        sum(src) src,
        sum(crc) crc,
        :results.array_unique(
                array_agg(rc.concept_id order by concept_id)
              ) cids
  from :results.record_counts rc
  group by  domain_id, standard_concept, vocabulary_id, concept_class_id, tbl, col, coltype ;

not using this either at the moment
  concept_groups_w_cids
    creates different grouping sets including lower levels of granularity
    for record counts. this is convenient for the api, but it's necessary
    in order to get descendant record counts later without double counting
    descendants.

    select count(*) from record_counts_agg --> 759
    select count(*) from concept_groups_w_cids --> 1951

    a sample of concept_groups_w_cids rows with low concept counts:

 cgid | grp |                                   grpset                                    |                                          vals                                          | cc | tblcols |   rc   | src |                                            cids
------+-----+-----------------------------------------------------------------------------+----------------------------------------------------------------------------------------+----+---------+--------+-----+---------------------------------------------------------------------------------------------
   21 |  31 | {standard_concept,domain_id}                                                | {S,Ethnicity}                                                                          |  2 |       1 | 624283 |   0 | {38003563,38003564}
  132 |  15 | {standard_concept,domain_id,vocabulary_id}                                  | {X,Metadata,PEDSnet}                                                                   |  9 |       3 |      0 |1475 | {2000000034,2000000035,2000000036,2000000037,2000000038,2000000049,2000000050,2000000051,2000000052}
  732 |   7 | {standard_concept,domain_id,vocabulary_id,concept_class_id}                 | {S,Observation,PCORNet,"Discharge Status"}                                             |  1 |       1 |      0 |   0 | {44814701}
  994 |   0 | {standard_concept,domain_id,vocabulary_id,concept_class_id,tbl,col,coltype} | {X,Observation,PCORNet,Race,"","",""}                                                  |  6 |       1 |      0 |   0 | {44814654,44814655,44814656,44814657,44814658,44814660}
 1398 |   0 | {standard_concept,domain_id,vocabulary_id,concept_class_id,tbl,col,coltype} | {X,"Spec Anatomic Site",CIEL,Anatomy,observation,observation_source_concept_id,source} |  3 |       1 |      0 |   6 | {45935765,45941602,45947121}
 1905 | 120 | {tbl,col,coltype}                                                           | {visit_occurrence,visit_type_concept_id,type}                                          |  1 |       1 |9263690 |   0 | {44818518}

    a little easier to read:

select vals, cc, tblcols, rc, src from concept_groups_w_cids where cgid in (21, 132, 732, 1905, 1350, 732);
                               vals                               | cc | tblcols |   rc    | src
------------------------------------------------------------------+----+---------+---------+------
 {S,Ethnicity}                                                    |  2 |       1 |  624283 |    0
 {X,Metadata,PEDSnet}                                             |  9 |       3 |       0 | 1475
 {S,Observation,PCORNet,"Discharge Status"}                       |  1 |       1 |       0 |    0
 {X,Drug,RxNorm,Ingredient,observation,value_as_concept_id,other} |  4 |       1 |       0 |    6
 {visit_occurrence,visit_type_concept_id,type}                    |  1 |       1 | 9263690 |    0

    all the grouping sets and their group counts:

select grpset,count(*) from concept_groups_w_cids group by 1 order by 1;
                                   grpset                                    | count
-----------------------------------------------------------------------------+-------
 {}                                                                          |     1
 {standard_concept}                                                          |     3
 {standard_concept,domain_id}                                                |    56
 {standard_concept,domain_id,vocabulary_id}                                  |   207
 {standard_concept,domain_id,vocabulary_id,concept_class_id}                 |   504
 {standard_concept,domain_id,vocabulary_id,concept_class_id,tbl,col,coltype} |   759
 {standard_concept,domain_id,vocabulary_id,tbl,col,coltype}                  |   366
 {tbl,col,coltype}                                                           |    55


drop table if exists :results.concept_groups_w_cids;
create table :results.concept_groups_w_cids as
  select  row_number() over (order by grpset) as cgid, 
          grp, grpset, 
          array(select row_to_json(x.*)->>unnest(x.grpset) col) vals,
          cc,tblcols, rc, src, crc, cids
  from (select    
              standard_concept,
              domain_id,
              vocabulary_id,
              concept_class_id,
              tbl,
              col,
              coltype,
              grouping(domain_id, standard_concept, vocabulary_id, concept_class_id, tbl, col, coltype) grp,
              (array_remove(array[
                case when grouping(domain_id) =     0 then 'domain_id'     else null end,
                case when grouping(standard_concept) =      0 then 'standard_concept'      else null end,
                case when grouping(vocabulary_id) =     0 then 'vocabulary_id'     else null end,
                case when grouping(concept_class_id) =     0 then 'concept_class_id'     else null end,
                case when grouping(tbl) =     0 then 'tbl'     else null end,
                case when grouping(col) =     0 then 'col'     else null end,
                case when grouping(coltype) = 0 then 'coltype' else null end
                  ], null))::text[] grpset,
              sum(cc) cc,
              count(distinct case when tbl='' then null else tbl||col end)::integer tblcols,
              sum(rc) rc,
              sum(src) src,
              sum(crc) crc,
              -- doing array_unique in order to sort list, there shouldn't
              -- actually be any duplicates
              :results.array_unique(:results.array_cat_agg(cids)) cids
    from :results.record_counts_agg rc
    group by  grouping sets   -- DON'T NEED ALL THESE GROUPINGS
                (rollup(
                        domain_id, standard_concept, vocabulary_id, concept_class_id, 
                        (tbl, col, coltype)
                        ),
                  (tbl,col,coltype),
                  (domain_id, standard_concept, vocabulary_id, tbl,col,coltype)
                )
  ) x;
create unique index cgccidx on :results.concept_groups_w_cids (cgid);
/* counts of cdm records, 1 rec for each concept * /
drop table if exists :results.cdmcnts cascade;
create table :results.cdmcnts as
        select  rc.concept_id, rc.cgid,
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
        from :results.concept_record rc
        join :results.concept_group cg
           on   rc.domain_id = cg.domain_id and
                rc.standard_concept = cg.standard_concept and
                rc.vocabulary_id = cg.vocabulary_id and
                rc.concept_class_id = cg.concept_class_id
        where rc.concept_id in (8504, 8505, 44631062, 44514581)
group by 1,2;
alter table :results.cdmcnts add primary key (concept_id);



-- source - standard - source report...

create temp table ami_icd9 as select concept_id from concept_info where vocabulary_id = 'ICD9CM' and concept_code like '410%';

select  ami.concept_id src_concept_id,
        cr.concept_code src_concept_code,
        rc.relationship,
        crr.concept_id target_concept_id,
        crr.concept_code target_concept_code,
        crr.standard_concept,
        crr.vocabulary_id,
        crr.domain_id,
        crr.concept_class_id,
        (unnest(coalesce(cr.rcs, ARRAY[]::rcs[]))).src,
        (unnest(coalesce(crr.rcs, ARRAY[]::rcs[]))).rc
from ami_icd9 ami
join concept_record cr on ami.concept_id = cr.concept_id
left join related_concept rc on ami.concept_id = rc.concept_id
left join concept_record crr on rc.related_concept_id = crr.concept_id
where crr.standard_concept = 'S'
order by 2
;
group by 1,2,3;

*/
