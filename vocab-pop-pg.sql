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
  FUNCTION get_concept_id_counts(_tbl regclass, _col text, target_table regclass) 
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
      'where %s > 0 ' ||
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
  
select get_concept_id_counts(
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

