


-- trying to understand non-standard concepts:

select c.concept_id,c.concept_name,c.domain_id,c.vocabulary_id,
        count(cr.concept_id_1) crs,count(distinct cr.concept_id_1) id1s, count(distinct cr.concept_id_2) id2s,
        array_agg(distinct r.defines_ancestry||' '||r.is_hierarchical||' '||cr.relationship_id) rels,
        array_agg(distinct c2.concept_class_id) relclasses
from cdm2.concept c
join cdm2.concept_relationship cr on c.concept_id=cr.concept_id_1 and cr.invalid_reason is null
join cdm2.concept c2 on cr.concept_id_2=c2.concept_id and c2.invalid_reason is null
join cdm2.relationship r on cr.relationship_id=r.relationship_id
where c.standard_concept is null and c.invalid_reason is null
group by 1,2,3,4
order by 5 desc, 8 desc, 6 desc, 7 desc
limit 20;

-- realizing that relationship_name does have vital information for understanding relationships
select r.defines_ancestry da, r.is_hierarchical ish, r.relationship_name, c.concept_id, 
        c.concept_code,
        c.concept_name, 
        c.standard_concept sc, c.domain_id, c.vocabulary_id, c.concept_class_id
from cdm2.concept_relationship cr
join cdm2.concept c on cr.concept_id_2 = c.concept_id
join cdm2.relationship r on cr.relationship_id=r.relationship_id
where cr.concept_id_1 = 44824072 --and c.vocabulary_id='ICD9CM'
and   cr.invalid_reason is null
order by 3, sc, domain_id, vocabulary_id;


