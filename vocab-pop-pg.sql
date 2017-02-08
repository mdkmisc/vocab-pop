-- change these settings to the appropriate cdm and results schemas
--   right now not all queries have table names qualified by schema, that
--   needs to be fixed
\set cdm cdm2
set session my.vars.cdm = :cdm; -- lets me use it as string in query (as per http://stackoverflow.com/a/29469454/1368860)
\set results results2
set session my.vars.results = :results;

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
create or replace view :results.concept_cols as
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
  rc bigint,
  drc bigint
);

CREATE OR REPLACE 
  FUNCTION store_concept_id_counts(
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
    RAISE NOTICE 'getting concept_ids for %', _tbl;
    sql := format(
      'INSERT INTO %s.%s ' ||   -- concept_id_occurrence
      'SELECT ' ||
      '       ''%s'' as schema, ' ||
      '       ''%s'' as table_name, ' ||
      '       ''%s'' as column_name, ' ||
      '       ''%s'' as column_type, ' ||
      '       %s as concept_id, ' ||
      '       count(*) as count ' ||
      'from (select * from %s.%s) t ' ||
      --'from (select * from %s.%s limit 5) t ' ||
      --'where %s > 0 ' ||
      'group by 1,2,3,4,5',
        target_schema, target_table, 
        _schema, 
        _tbl, 
        _col, 
        _col_type, 
        _col, 
        _schema, _tbl
      );
    RAISE NOTICE '%', sql;
    EXECUTE sql;
  END;
  $func$ LANGUAGE plpgsql;

select store_concept_id_counts(
          schema::text,
          table_name::text,
          column_name::text,
          column_type::text,
          target_schema::text,
          target_table::text
) from
  (select 'cdm2' as schema,
          table_name,
          column_name,
          column_type,
          current_setting('my.vars.results')::text target_schema, 
          'concept_id_occurrence'::text target_table
    from concept_cols cc) x;
alter table :results.concept_id_occurrence add primary key (table_name, column_name, concept_id);
create index cio_idx1 on :results.concept_id_occurrence (concept_id);

/* get rid of concept counts for invalid concepts --
    revisit this, do we want these counts so we can report
    on invalid concepts appearing in the CDM? probably. but
    for now it just complicates things.
    (though some of the vocab-pop code assumes that there will be invalid
    concepts and allows them to be counted or filtered out)
*/
delete from concept_id_occurrence cio
using cdm2.concept c
where cio.concept_id = c.concept_id and c.invalid_reason is not null;


/* record_counts table
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

 concept_id |     domain_id      | standard_concept | vocabulary_id |  class_concept_id  |     tbl     |              col              | coltype | rc  | src
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
drop table if exists :results.record_counts cascade;
create table :results.record_counts as (
  select  
          c.concept_id,
          c.domain_id domain_id,
          coalesce(c.standard_concept, 'X') standard_concept, 
          c.vocabulary_id vocabulary_id,
          c.concept_class_id class_concept_id,
          --cio.schema,
          coalesce(cio.table_name,'') tbl,
          coalesce(cio.column_name,'') col,
          coalesce(cio.column_type,'') coltype,
          case when c.standard_concept is null then 0 
                else coalesce(cio.count,0) end rc, --record count
          case when c.standard_concept is null then coalesce(cio.count,0) 
                else 0 end src --source record count
  from :cdm.concept c
  left join :results.concept_id_occurrence cio on c.concept_id = cio.concept_id
);
create unique index rcidx on :results.record_counts (concept_id,tbl,col);
create index rc_concept_att_idx on :results.record_counts 
              (domain_id, standard_concept, vocabulary_id, class_concept_id, tbl, col, coltype);

CREATE OR REPLACE FUNCTION results2.array_unique(arr anyarray)
 RETURNS anyarray
 LANGUAGE sql
AS $function$
    select array( select distinct unnest($1) order by 1 )
$function$;

/* record_counts_agg
    groups by all the attribute columns we have and aggregates counts
    and includes an array of all concept ids in each groups */
create table record_counts_agg as
  select
        row_number() over () as rcgid, -- could link concept_groups_w_cids back to here, but no need
                                       -- so no need for this id
        standard_concept, domain_id, vocabulary_id, class_concept_id, tbl, col, coltype,
        count(distinct concept_id)::integer cc,
        count(*)::integer rc_rowcnt,
        count(distinct tbl||col)::integer tblcols,
        sum(rc) rc,
        sum(src) src,
        array_remove(array_unique(
                array_agg(rc.concept_id order by concept_id)
              ),null) cids
  from results2.record_counts rc
  group by  standard_concept, domain_id, vocabulary_id, class_concept_id, tbl, col, coltype ;

CREATE AGGREGATE array_cat_agg(anyarray) (
  SFUNC=array_cat,
  STYPE=anyarray
);

/* concept_groups_w_cids
    creates different grouping sets including lower levels of granularity
    for record counts. this is convenient for the api, but it's necessary
    in order to get descendant record counts later without double counting
    descendants.

    select count(*) from record_counts_agg --> 759
    select count(*) from concept_groups_w_cids --> 1951

    a sample of concept_groups_w_cids rows with low concept counts:

 cgid | grp |                                   grpset                                    |                                          vals                                          | cc | rc_rowcnt | tblcols |   rc   | src |                                            cids
------+-----+-----------------------------------------------------------------------------+----------------------------------------------------------------------------------------+----+-----------+---------+--------+-----+---------------------------------------------------------------------------------------------
   21 |  31 | {standard_concept,domain_id}                                                | {S,Ethnicity}                                                                          |  2 |         2 |       1 | 624283 |   0 | {38003563,38003564}
  132 |  15 | {standard_concept,domain_id,vocabulary_id}                                  | {X,Metadata,PEDSnet}                                                                   |  9 |         9 |       3 |      0 |1475 | {2000000034,2000000035,2000000036,2000000037,2000000038,2000000049,2000000050,2000000051,2000000052}
  732 |   7 | {standard_concept,domain_id,vocabulary_id,class_concept_id}                 | {S,Observation,PCORNet,"Discharge Status"}                                             |  1 |         1 |       1 |      0 |   0 | {44814701}
  994 |   0 | {standard_concept,domain_id,vocabulary_id,class_concept_id,tbl,col,coltype} | {X,Observation,PCORNet,Race,"","",""}                                                  |  6 |         6 |       1 |      0 |   0 | {44814654,44814655,44814656,44814657,44814658,44814660}
 1398 |   0 | {standard_concept,domain_id,vocabulary_id,class_concept_id,tbl,col,coltype} | {X,"Spec Anatomic Site",CIEL,Anatomy,observation,observation_source_concept_id,source} |  3 |         3 |       1 |      0 |   6 | {45935765,45941602,45947121}
 1905 | 120 | {tbl,col,coltype}                                                           | {visit_occurrence,visit_type_concept_id,type}                                          |  1 |         1 |       1 |9263690 |   0 | {44818518}

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
 {standard_concept,domain_id,vocabulary_id,class_concept_id}                 |   504
 {standard_concept,domain_id,vocabulary_id,class_concept_id,tbl,col,coltype} |   759
 {standard_concept,domain_id,vocabulary_id,tbl,col,coltype}                  |   366
 {tbl,col,coltype}                                                           |    55
*/
create table concept_groups_w_cids as
  select  row_number() over (order by grpset) as cgid, 
          grp, grpset, 
          array(select row_to_json(x.*)->>unnest(x.grpset) col) vals,
          cc,rc_rowcnt, tblcols, rc, src, cids
  from (select    
              standard_concept,
              domain_id,
              vocabulary_id,
              class_concept_id,
              tbl,
              col,
              coltype,
              grouping(domain_id, standard_concept, vocabulary_id, class_concept_id, tbl, col, coltype) grp,
              (array_remove(array[
                case when grouping(standard_concept) =      0 then 'standard_concept'      else null end,
                case when grouping(domain_id) =     0 then 'domain_id'     else null end,
                case when grouping(vocabulary_id) =     0 then 'vocabulary_id'     else null end,
                case when grouping(class_concept_id) =     0 then 'class_concept_id'     else null end,
                case when grouping(tbl) =     0 then 'tbl'     else null end,
                case when grouping(col) =     0 then 'col'     else null end,
                case when grouping(coltype) = 0 then 'coltype' else null end
                  ], null))::text[] grpset,
              sum(cc) cc,
              sum(rc_rowcnt) rc_rowcnt,
              sum(tblcols) tblcols,
              sum(rc) rc,
              sum(src) src,
              -- doing array_unique in order to sort list, there shouldn't
              -- actually be any duplicates
              array_unique(array_cat_agg(cids)) cids
    from results2.record_counts_agg rc
    group by  grouping sets 
                (rollup(
                        standard_concept, domain_id, vocabulary_id, class_concept_id, 
                        (tbl, col, coltype)
                        ),
                  (tbl,col,coltype),
                  (standard_concept, domain_id, vocabulary_id, tbl,col,coltype)
                )
  ) x;
create unique index cgccidx on concept_groups_w_cids (cgid);

/* ancestor_plus_mapsto
    extended version of concept_ancestor table including concept_relationship
    'maps to' relationships and a single field telling which table the record
    came from and, if it came from concept_ancestor, the min and max separation
*/
drop materialized view :results.ancestor_plus_mapsto;
create materialized view :results.ancestor_plus_mapsto as
  select
          'ca ' || min_levels_of_separation || '-' 
                || max_levels_of_separation as source,
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
          'cr_mapsto' as source,
          cr.concept_id_1,
          cr.concept_id_2
  from :cdm.concept_relationship cr
  where cr.relationship_id = 'Maps to'
    and cr.invalid_reason is null
    and cr.concept_id_1 != cr.concept_id_2 ;
create unique index apmidx on ancestor_plus_mapsto (ancestor_concept_id,descendant_concept_id);


/* cg_dcids
    for every concept group (which includes different grouping levels)
    collect all the descendant concept ids connected to the concepts in
    that group. if we didn't go through all the steps we did to get here,
    there would be no way to be sure we only counted the descendant concept
    ids in each concept group only once.

    it would be better to include source but it takes so long to run, I've given
    up on that.

    also, doing the total group with every concept id (grpset = {}) separately
    for performance reasons
*/
drop table if exists cg_dcids;
create table cg_dcids as
    select  cgwc.cgid, --source, 
            array_remove(array_unique(
                    array_agg(apm.descendant_concept_id order by descendant_concept_id)
                  ),null) dcids
    from concept_groups_w_cids cgwc
    left join ancestor_plus_mapsto apm on apm.ancestor_concept_id = any(cgwc.cids)
    where grpset != array[]::text[]
    group by 1; --,2;
insert into cg_dcids  -- it should just be all desc ids, right?
  select cg.cgid, array_agg(apm.descendant_concept_id order by descendant_concept_id)
  from ancestor_plus_mapsto apm,
       (select distinct cgid from concept_groups_w_cids where grpset = array[]::text[]) cg

/*
    cg_dcids (above) has one row for each concept group with an array of its
    descendant concept ids -- 1951 rows. But there are only 275 distinct arrays
    of descendant concept ids, so I'm giving them their own smaller table with
    one row per distinct descendant id set and a list of all the concept group
    ids having that descendant group for its descendants
*/
drop table if exists dcid_groups;
create table dcid_groups as
  select  row_number() over () as dcid_grp_id,
          array_agg(cgid) cgids,
          dcids
  from cg_dcids group by dcids;

/* dcid_cnts
    now, for each descendant group, go back to the record_counts table
    for counts and aggregate them. this combines counts across different
    tables/columns where counted records appear, which, for some concepts,
    might be misleading. but we do a breakdown later

 dcid_grp_id |                  cgids                   |   dcc   | dtblcols |    drc    |   dsrc
-------------+------------------------------------------+---------+----------+-----------+----------
           1 | {208}                                    |   85250 |        4 |    201516 |        0
           2 | {2}                                      | 1738752 |       25 | 263282174 | 40499979
           4 | {609,1320}                               |      10 |        1 |         0 |        0
           5 | {705,1494}                               |   15031 |        5 |   3758970 |        0
*/
drop table if exists dcid_cnts;
create table dcid_cnts as
  select  dcid_grp_id, cgids, 
          count(rc.concept_id) dcc,
          count(distinct rc.tbl||rc.col) dtblcols,
          sum(rc.rc) drc,
          sum(rc.src) dsrc
  from dcid_groups dg
  left join record_counts rc on rc.concept_id = any(dg.dcids)
  group by 1,2;

  
/* concept_groups
    this is the main counts table. it brings together what we already know
    about concept groups with descendant counts. as mentioned above, these
    descendant counts can be misleading, but they'll do for a first pass
*/
drop table if exists concept_groups cascade;
create table concept_groups as
  select  cgw.cgid, cgw.grp, cgw.grpset, cgw.vals, 
          cgw.cc, cgw.rc_rowcnt, cgw.tblcols, cgw.rc, cgw.src, 
          dg.dcid_grp_id,
          dg.dcc,
          dg.dtblcols,
          dg.drc,
          dg.dsrc
  from concept_groups_w_cids cgw
  join dcid_cnts dg on cgw.cgid = any(dg.cgids);



/* dcid_cnts_breakdown
    now we get descendant record counts broken down by the same groupings
    as we used for concept groups. i don't know if these will all be useful,
    but it gives us access to more meaningful descendant counts than the
    concept_groups table. at least the {tbl,col,coltype} groupings will
    be important, but I think others will be as well, if we can make a
    reasonable ui for navigating them.
*/
drop table if exists dcid_cnts_breakdown cascade;
create table dcid_cnts_breakdown (
  dcid_grp_id integer,
  grp integer,
  grpset text[],
  vals text[],
  dcc bigint,
  drc_rowcnt bigint,
  dtblcols bigint,
  drc bigint,
  dsrc bigint,
  dcids integer[]
);

CREATE OR REPLACE FUNCTION make_dcid_cnts_breakdown() returns integer AS $func$
  declare dcid_group record;
  BEGIN
    for dcid_group in select * from dcid_groups loop
      RAISE NOTICE 'dcid_group %: % cids, % dcids', 
        dcid_group.dcid_grp_id, 
        array_length(dcid_group.dcids,1),
        array_length(dcid_group.cgids,1);
        insert into dcid_cnts_breakdown
          select  dcid_group.dcid_grp_id,dcid_group.cgids,
                  x.grp, x.grpset, 
                  array(select row_to_json(x.*)->>unnest(x.grpset) col) vals,
                  cc dcc,rc_rowcnt drc_rowcnt, tblcols dtblcols, rc drc, src dsrc, cids dcids
          from (
            select    distinct
                      domain_id,
                      standard_concept,
                      vocabulary_id,
                      class_concept_id,
                      tbl,
                      col,
                      coltype,
                      grouping(domain_id, standard_concept, vocabulary_id, class_concept_id, tbl, col, coltype) grp,
                      (array_remove(array[
                        case when grouping(domain_id) =     0 then 'domain_id'     else null end,
                        case when grouping(standard_concept) =      0 then 'standard_concept'      else null end,
                        case when grouping(vocabulary_id) =     0 then 'vocabulary_id'     else null end,
                        case when grouping(class_concept_id) =     0 then 'class_concept_id'     else null end,
                        case when grouping(tbl) =     0 then 'tbl'     else null end,
                        case when grouping(col) =     0 then 'col'     else null end,
                        case when grouping(coltype) = 0 then 'coltype' else null end
                          ], null))::text[] grpset,
                      count(distinct concept_id)::integer cc,
                      count(*)::integer rc_rowcnt,
                      count(distinct tbl||col)::integer tblcols,
                      sum(rc) rc,
                      sum(src) src,
                      array_remove(array_unique(
                              array_agg(rc.concept_id order by concept_id)
                            ),null) cids
            from results2.record_counts rc
            --where cardinality($1) = 0 or rc.concept_id = any($1)
            where rc.concept_id = any(dcid_group.dcids)
            group by  grouping sets 
                        (rollup(
                                standard_concept, domain_id, vocabulary_id, class_concept_id, 
                                (tbl, col, coltype)
                              ),
                        (tbl,col,coltype),
                        (standard_concept, domain_id, vocabulary_id, tbl,col,coltype)
                      )
                    ) x;
    end loop;
    return 1;
  END;
  $func$ LANGUAGE plpgsql;

select * from make_dcid_cnts_breakdown();

