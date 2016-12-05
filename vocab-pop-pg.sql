--set search_path = 'cdm2';

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

/*
drop type if exists :results.concept_id_occurrence_rec cascade;
create type :results.concept_id_occurrence_rec as (
  --table_schema information_schema.sql_identifier,
  table_name text,
  column_name text,
  concept_id integer,
  count bigint);
*/


CREATE OR REPLACE 
  FUNCTION store_concept_id_counts(_tbl regclass, _col text, target_table regclass) 
  RETURNS TABLE(
                  table_name text,
                  column_name text,
                  concept_id integer,
                  count bigint
                )
  AS
  $func$
  BEGIN
    --RETURN QUERY
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
      , target_table, _tbl, _col, _col, _tbl, _col);
  END;
  $func$ LANGUAGE plpgsql;
/*
    RETURN QUERY
      SELECT _tbl as table_name,
             _col::text as column_name,
             _col as concept_id,
             count(*) as count
      FROM :_tbl
      GROUP BY 1,2,3;
    EXECUTE format(
      'SELECT ''%s'' as table_name::text, ' ||
      '       ''%s'' as column_name, ' ||
      '       %s as concept_id, ' ||
      '       count(*) as count ' ||
      'from %s t ' ||
      'group by 1,2,3'
      , _tbl, _col)
CREATE FUNCTION concept_id_counts(_sno integer, _eid integer, _sd date, _ed date, _sid integer, _status boolean)
  RETURNS void AS
  $BODY$
      BEGIN
        INSERT INTO app_for_leave(sno, eid, sd, ed, sid, status)
        VALUES(_sno, _eid, _sd, _ed, _sid, _status);
      END;
  $BODY$
  LANGUAGE 'plpgsql' VOLATILE
  COST 100;
*/
  
select store_concept_id_counts(
          tbl, col,
          current_setting('my.vars.results')||'.concept_id_occurrence'
) from (
  select (table_schema||'.'||table_name)::regclass as tbl, column_name::text as col
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



drop materialized view if exists :results.class_hierarichy;
create materialized view :results.class_hierarichy as
select
        c1.vocabulary_id vocab_1,
        c1.concept_class_id as class_1,
        c1.standard_concept as sc1,
        r.relationship_name,
        c2.vocabulary_id vocab_2,
        c2.concept_class_id as class_2,
        c2.standard_concept as sc2,
        count(distinct c1.concept_id) as c1_ids,
        count(distinct c2.concept_id) as c2_ids,
        count(*) c
from :cdm.concept_relationship cr
join :cdm.concept c1 on cr.concept_id_1 = c1.concept_id and c1.invalid_reason is null
join :cdm.concept c2 on cr.concept_id_2 = c2.concept_id and c2.invalid_reason is null
join :cdm.relationship r on cr.relationship_id = r.relationship_id
where r.is_hierarchical = '1'
  --and c1.vocabulary_id = c2.vocabulary_id
group by 1,2,3,4,5,6,7
having count(distinct c1.concept_id) <= count(distinct c2.concept_id)
   and count(distinct c2.concept_id) >  count(distinct c1.concept_id)


drop materialized view if exists :results.concept_info_stats;
create materialized view :results.concept_info_stats as
  select  replace( cio.table_name, current_setting('my.vars.cdm')||'.', '') as table_name,
          cio.column_name,
          case when invalid_reason is null then true else false end as invalid,
          standard_concept as sc,
          domain_id,
          vocabulary_id,
          concept_class_id,
          count(*) as conceptrecs,
          sum(count) as dbrecs
  from :cdm.concept c 
  left outer join :results.concept_id_occurrence cio on c.concept_id = cio.concept_id
  group by 1,2,3,4,5,6,7;



/*  drug_exposure
select c.domain_id, count(*) from concept c join drug_exposure de on c.concept_id = de.drug_concept_id where concept_id != 0 group by 1;
 domain_id |    count
-----------+------------
 Drug      | 10,302,887
*/


/*  condition_occurrence
select c.domain_id, count(*) from concept c join condition_occurrence co on c.concept_id = co.condition_concept_id where concept_id != 0 group by 1;
  domain_id  |    count
-------------+------------
 Procedure   |    793,401
 Measurement |    229,614
 Condition   | 18,482,627
 Observation |  2,844,322
*/

/*  death
select c.domain_id, count(*) from concept c join death d on c.concept_id = d.cause_concept_id where concept_id != 0 group by 1;
  domain_id  | count
-------------+-------
 Condition   |   201
 Observation |  1274
*/

/* 
select c.domain_id, count(*) from concept c join device_exposure d on c.concept_id = d.device_concept_id where concept_id != 0 group by 1;
-- 0 rows
*/

/*  measurement
select c.domain_id, count(*) from concept c join measurement m on c.concept_id = m.measurement_concept_id where concept_id != 0 group by 1;
  domain_id  |    count
-------------+------------
 Measurement | 71,978,676
*/


/*  observation
select c.domain_id, count(*) from concept c join observation o on c.concept_id = o.observation_concept_id where concept_id != 0 group by 1;
  domain_id   |    count
--------------+------------
 Measurement  |    91,141
 Condition    |  1,108,027
 Observation  | 19,026,136
 Type Concept |  9,235,879
*/

/*  procedure_occurrence
select c.domain_id, count(*) from concept c join procedure_occurrence po on c.concept_id = po.procedure_concept_id where concept_id != 0 group by 1;
  domain_id  |    count
-------------+------------
 Procedure   | 11,525,847
 Measurement |  6,705,047
 Drug        |   573,666
 Device      |   765,848
 Observation |   432,701
*/


/*  visit
select c.domain_id, count(*) from concept c join visit_occurrence v on c.concept_id = v.visit_concept_id where concept_id != 0 group by 1;
 domain_id |    count
-----------+-----------
 Visit     | 9,263,690
*/


/*
other tables to explore for vocab/pop browser:

care_site
fact_relationship -- is this table correct?
location?
observation_period?
payer_plan_period?
person (demographics?)
cost tables?
provider (specialty)?
visit

*/

