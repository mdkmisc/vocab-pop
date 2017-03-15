

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
    from :results.concept_cols cc) x;
alter table :results.concept_id_occurrence add primary key (table_name, column_name, concept_id);
create index cio_idx1 on :results.concept_id_occurrence (concept_id);

/* get rid of concept counts for invalid concepts --
    revisit this, do we want these counts so we can report
    on invalid concepts appearing in the CDM? probably. but
    for now it just complicates things.
    (though some of the vocab-pop code assumes that there will be invalid
    concepts and allows them to be counted or filtered out)
*/

/* PUT A WARNING HERE IN SCRIPT OUTPUT IF RECS DELETED!!! */
-- instead, leaving them here, but not including in record_counts
/*
delete from :results.concept_id_occurrence cio
using :cdm.concept c
where cio.concept_id = c.concept_id and c.invalid_reason is not null;
*/


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
drop table if exists :results.record_counts cascade;
create table :results.record_counts as (
  select  
          c.concept_id,
          c.concept_code,
          c.concept_name,

          c.domain_id,
          coalesce(c.standard_concept, 'X') standard_concept, 
          c.vocabulary_id,
          c.concept_class_id,
          --cio.schema,
          coalesce(cio.table_name,'') tbl,
          coalesce(cio.column_name,'') col,
          coalesce(cio.column_type,'') coltype,
          coalesce(case when c.standard_concept = 'S' then cio.cnt else 0 end, 0) as rc,
          coalesce(case when c.standard_concept is null then cio.cnt else 0 end, 0) as src,
          coalesce(case when c.standard_concept = 'C' then cio.cnt else 0 end, 0) as crc
  from :cdm.concept c
  left join :results.concept_id_occurrence cio on c.concept_id = cio.concept_id
  where c.invalid_reason is null
);
create unique index rcidx on :results.record_counts (concept_id,tbl,col);
create index rc_concept_att_idx on :results.record_counts 
              (domain_id, standard_concept, vocabulary_id, concept_class_id, tbl, col, coltype);

/* record_counts_agg
    groups by all the attribute columns we have and aggregates counts
    and includes an array of all concept ids in each groups */
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

/* concept_groups_w_cids
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
*/
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
    group by  grouping sets 
                (rollup(
                        domain_id, standard_concept, vocabulary_id, concept_class_id, 
                        (tbl, col, coltype)
                        ),
                  (tbl,col,coltype),
                  (domain_id, standard_concept, vocabulary_id, tbl,col,coltype)
                )
  ) x;
create unique index cgccidx on :results.concept_groups_w_cids (cgid);


