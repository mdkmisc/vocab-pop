drop table if exists :results one_way_relationships;
create table :results.one_way_relationships as
  select r.*
  from :cdm.relationship r
  join (
      select r1.relationship_id rid_1, r1.reverse_relationship_id rrid_1, r2.relationship_id rid_2,r2.reverse_relationship_id rrid_2,
              r1.defines_ancestry d1,
              r2.defines_ancestry d2,
              r1.is_hierarchical h1,
              r2.is_hierarchical h2,
              case when r1.relationship_id < r2.relationship_id then r1.relationship_id else r2.relationship_id end relationship_id,
              case when r1.relationship_id < r2.relationship_id then r1.relationship_id else r2.relationship_name end relationship_name,
              case when r1.relationship_id < r2.relationship_id then 'r1' else 'r2' end,
              r1.relationship_name,
              r2.relationship_name
      from :cdm.relationship r1
      left join :cdm.relationship r2 on r1.relationship_id = r2.reverse_relationship_id or  r2.relationship_id = r1.reverse_relationship_id
      where
            (r1.defines_ancestry::integer + r1.is_hierarchical::integer = r2.defines_ancestry::integer + r2.is_hierarchical::integer and r1.relationship_id < r2.relationship_id) or
            (r1.defines_ancestry::integer + r1.is_hierarchical::integer > r2.defines_ancestry::integer + r2.is_hierarchical::integer and r1.relationship_id < r2.relationship_id) or
            (r1.defines_ancestry::integer + r1.is_hierarchical::integer < r2.defines_ancestry::integer + r2.is_hierarchical::integer and r1.relationship_id > r2.relationship_id)
      order by 9,10
    ) one_way on r.relationship_id = one_way.relationship_id
  ;
create index onewayrelidx on :results.one_way_relationships (relationship_id);
-- trying to understand non-standard concepts:

-- realizing that relationship_name does have vital information for understanding relationships

select * from :cdm.concept where concept_id = 44824072;

select  distinct
        r.defines_ancestry, r.is_hierarchical, r.relationship_name, c.concept_id, 
        c.concept_code, c.concept_name, 
        c.standard_concept sc, c.domain_id, c.vocabulary_id, c.concept_class_id
from :cdm.concept_relationship cr
join :cdm.concept c on cr.concept_id_2 = c.concept_id
join :results.one_way_relationships r on cr.relationship_id=r.relationship_id
where cr.concept_id_1 = 44824072 --and c.vocabulary_id='ICD9CM'
and   cr.invalid_reason is null
order by 3, sc, domain_id, vocabulary_id;

select r.defines_ancestry, r.is_hierarchical, r.relationship_name, 
        c.standard_concept sc, c.domain_id, c.vocabulary_id, c.concept_class_id,
        count(distinct c.concept_id)
from :cdm.concept_relationship cr
join :cdm.concept c on cr.concept_id_2 = c.concept_id
join :results.one_way_relationships r on cr.relationship_id=r.relationship_id
where cr.concept_id_1 = 44824072
and   cr.invalid_reason is null
group by 1,2,3,4,5,6,7
order by 3, sc, domain_id, vocabulary_id;

/*

select c.concept_id,c.concept_name,c.domain_id,c.vocabulary_id,
        count(cr.concept_id_1) crs,count(distinct cr.concept_id_1) id1s, count(distinct cr.concept_id_2) id2s,
        array_agg(distinct r.defines_ancestry||' '||r.is_hierarchical||' '||cr.relationship_id) rels,
        array_agg(distinct c2.concept_class_id) relclasses
from :cdm.concept c
join :cdm.concept_relationship cr on c.concept_id=cr.concept_id_1 and cr.invalid_reason is null
join :cdm.concept c2 on cr.concept_id_2=c2.concept_id and c2.invalid_reason is null
join :cdm.relationship r on cr.relationship_id=r.relationship_id
where c.standard_concept is null and c.invalid_reason is null
group by 1,2,3,4
order by 5 desc, 8 desc, 6 desc, 7 desc
limit 20;
*/
