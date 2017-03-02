
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

