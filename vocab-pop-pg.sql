\set cdm cdm2
set session my.vars.cdm = :cdm; -- lets me use it as string in query (as per http://stackoverflow.com/a/29469454/1368860)
\set results results2
set session my.vars.results = :results;

drop table if exists :results.concept_id_occurrence;

create table :results.concept_id_occurrence (
  --table_schema information_schema.sql_identifier,
  table_name text,
  column_name text,
  concept_id integer,
  count bigint
);

CREATE OR REPLACE 
  FUNCTION store_concept_id_counts(_qtbl regclass, _tbl, _col text, target_table regclass) 
  RETURNS TABLE(
                  table_name text,
                  column_name text,
                  concept_id integer,
                  count bigint
                )
  AS
  $func$
  BEGIN
    RAISE NOTICE 'getting concept_ids for %.%', _tbl, _col;
    EXECUTE format(
      'INSERT INTO %s ' ||
      'SELECT ''%s'' as table_name, ' ||
      '       ''%s'' as column_name, ' ||
      '       %s as concept_id, ' ||
      '       count(*) as count ' ||
      'from %s t ' ||
      --'where %s > 0 ' ||
      'group by 1,2,3'
      , target_table, _tbl, _col, _col, _qtbl);
  END;
  $func$ LANGUAGE plpgsql;
  
select store_concept_id_counts(
          tbl, col,
          current_setting('my.vars.results')||'.concept_id_occurrence'
) from (
  /* select (table_schema||'.'||table_name)::regclass as tbl, column_name::text as col */
  select (table_schema||'.'||table_name)::regclass as tbl, 
            table_name,
            column_name::text as col
  from information_schema.columns 
  where table_schema = current_setting('my.vars.cdm') 
    and table_name not like '%concept%' 
    and table_name != 'fact_relationship' -- at least for now
    and column_name like '%concept_id%'
  --limit 3
) cols;

alter table :results.concept_id_occurrence add primary key (table_name, column_name, concept_id);
create index cio_idx1 on :results.concept_id_occurrence (concept_id);

create or replace view :results.concept_info as
  select  cio.*, 
          concept_name,
          invalid_reason, 
          standard_concept, 
          domain_id, 
          vocabulary_id, 
          concept_class_id 
  from :results.concept_id_occurrence cio 
  join :cdm.concept c on cio.concept_id = c.concept_id;

create or replace view :results.concept_info_narrow as
  select  cio.*, 
          substr(concept_name, 0, 31) as concept_name_30_chars,
          invalid_reason as ir,
          standard_concept as sc,
          domain_id,
          vocabulary_id,
          concept_class_id
  from :results.concept_id_occurrence cio
  join :cdm.concept c on cio.concept_id = c.concept_id;



/* should be view or materialzed view */
drop table if exists :results.class_relations cascade;
create table :results.class_relations as
select
        case when c1.vocabulary_id = c2.vocabulary_id then true else false end as same_vocab,
        case when c1.concept_class_id = c2.concept_class_id then true else false end as same_class,

        r.relationship_id,
        r.relationship_name,
        r.is_hierarchical,
        r.defines_ancestry,
        r.reverse_relationship_id,

          /*
            thought i should include No Matching Concept indicator since concept_id
            isn't included, but you can get it by testing vocab_1 = 'None'
          */
        c1.domain_id as domain_id_1,
        c1.vocabulary_id as vocab_1,
        c1.concept_class_id as class_1,
        c1.standard_concept as sc_1,
        case when c1.invalid_reason is null then false else true end as invalid_1,

        c2.domain_id as domain_id_2,
        c2.vocabulary_id as vocab_2,
        c2.concept_class_id as class_2,
        c2.standard_concept as sc_2,
        case when c2.invalid_reason is null then false else true end as invalid_2,

        count(distinct c1.concept_id) as c1_ids,
        count(distinct c2.concept_id) as c2_ids,
        count(*) c
from :cdm.concept_relationship cr
join :cdm.concept c1 on cr.concept_id_1 = c1.concept_id /* and c1.invalid_reason is null */
join :cdm.concept c2 on cr.concept_id_2 = c2.concept_id /* and c2.invalid_reason is null */
join :cdm.relationship r on cr.relationship_id = r.relationship_id
where cr.invalid_reason is null
group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17
;
/* where r.is_hierarchical = '1' and c1.vocabulary_id = c2.vocabulary_id */
/*having count(distinct c1.concept_id) <= count(distinct c2.concept_id) and count(distinct c2.concept_id) >  count(distinct c1.concept_id) */


/* should be view or materialzed view */
drop table if exists :results.concept_info_stats;
create table :results.concept_info_stats as
  /* select  replace( cio.table_name, current_setting('my.vars.cdm')||'.', '') as table_name, */
  select  cio.table_name,
          cio.column_name,
          c.domain_id,
          c.vocabulary_id,
          c.concept_class_id,
          c.standard_concept as sc,
          case when c.invalid_reason is null then false else true end as invalid,
          count(*) as conceptrecs,
          sum(cio.count) as dbrecs
  from :cdm.concept c 
  left outer join :results.concept_id_occurrence cio on c.concept_id = cio.concept_id
  group by 1,2,3,4,5,6,7;

/* totally broken:
create or replace view :results.class_relations_with_stats as
  select cr.*,
          cis1.table_name as table_name_1,
          cis1.column_name as column_name_1,
          sum(cis1.conceptrecs) as conceptrecs_1,
          sum(cis1.dbrecs) as dbrecs_1,
          count(cis1.table_name) as stats_recs_1,
          cis2.table_name as table_name_2,
          cis2.column_name as column_name_2,
          sum(cis2.conceptrecs) as conceptrecs_2,
          sum(cis2.dbrecs) as dbrecs_2,
          count(cis2.table_name) as stats_recs_2
  from :results.class_relations cr
  left outer join :results.concept_info_stats cis1
    on  cr.domain_id_1 = cis1.domain_id
    and cr.vocab_1 = cis1.vocabulary_id
    and cr.class_1 = cis1.concept_class_id
    and cr.sc_1 = cis1.sc
    and cr.invalid_1 = cis1.invalid
  left outer join :results.concept_info_stats cis2
    on  cr.domain_id_2 = cis2.domain_id
    and cr.vocab_2 = cis2.vocabulary_id
    and cr.class_2 = cis2.concept_class_id
    and cr.sc_2 = cis2.sc
    and cr.invalid_2 = cis2.invalid
group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,26,27
*/
