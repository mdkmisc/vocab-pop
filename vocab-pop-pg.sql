\set cdm cdm2
set session my.vars.cdm = :cdm; -- lets me use it as string in query (as per http://stackoverflow.com/a/29469454/1368860)
\set results results2
set session my.vars.results = :results;

create or replace view :results.concept_cols as
  select (table_schema||'.'||table_name)::regclass as tbl, 
            table_name,
            column_name::text as col
  from information_schema.columns 
  where
        table_schema = current_setting('my.vars.cdm') 
        and table_name not like '%concept%' 
        and table_name != 'fact_relationship' -- at least for now
        and (
              column_name like '%concept_id%' or
              column_name like '%source_value'
            )
    ;

create or replace view :results.concept_cols_by_table as
  with denest as
  (
    with col_grps as
    (
      with table_cols as
      (
        select table_name,
                array_agg(col) as cols
        from concept_cols cc
        /*
        where
          col not like 'qualifier%' and
          col not like 'value%' and
          col not like 'modifier%' and
          col not like 'operator%' and
          col not like 'range%' and
          col not like 'priority%' and
          col not like 'dose_unit%' and
          col not like 'route%' and
          col not like 'unit%' and
          col != 'specimen_source_value' and
          col != 'eff_drug_dose_source_value' and
          col not like 'death_impute%'
        */
        group by table_name
      )
      select  table_name,
              (select array_agg(col) from unnest(cols) as col where col not like '%type%' and col not like '%source%' and
                        col not like 'qualifier%' and
                        col not like 'value%' and
                        col not like 'modifier%' and
                        col not like 'operator%' and
                        col not like 'range%' and
                        col not like 'priority%' and
                        col not like 'dose_unit%' and
                        col not like 'route%' and
                        col not like 'unit%' and
                        col != 'specimen_source_value' and
                        col != 'eff_drug_dose_source_value' and
                        col not like 'death_impute%'
                    ) as target_cols,
              (select array_agg(col) from unnest(cols) as col where col like '%type%') as type_cols,
              (select array_agg(col) from unnest(cols) as col where col like '%source%' and col not like '%source_value') as source_cols,
              (select array_agg(col) from unnest(cols) as col where col like '%source_value') as source_value_cols,
              (select array_agg(col) from unnest(cols) as col where col not like '%type%' and col not like '%source%' and (
                        col like 'qualifier%' or
                        col like 'value%' or
                        col like 'modifier%' or
                        col like 'operator%' or
                        col like 'range%' or
                        col like 'priority%' or
                        col like 'dose_unit%' or
                        col like 'route%' or
                        col like 'unit%' or
                        col = 'specimen_source_value' or
                        col = 'eff_drug_dose_source_value' or
                        col like 'death_impute%'
                    )) as other_cols
              /*(select array_to_string(array_agg(other_cols), E'\n') from unnest(cols) as other_cols where other_cols not like '%type%') as other_cols_str,*/
              /*array_to_string(cols, E'\n') || E'\n' cols*/
      from table_cols
      group by table_name, cols
    )
    select table_name, 
            unnest(target_cols) target_col, /*, cols*/
            unnest(type_cols) type_col, 
            unnest(source_cols) source_col, 
            unnest(source_value_cols) source_value_col
    from col_grps
  )
  select *
  from denest
  where type_col is not null
    and source_col is not null
    and target_col is not null
  ;


drop table if exists :results.concept_id_occurrence;
create table :results.concept_id_occurrence (
  --table_schema information_schema.sql_identifier,
  schema text,
  table_name text,
  target_column_name text,
  type_column_name text,
  source_column_name text,
  source_value_column_name text,
  target_concept_id integer,
  type_concept_id integer,
  source_concept_id integer,
  source_value text,
  count bigint
);

CREATE OR REPLACE 
  FUNCTION store_concept_id_counts(
              _schema text,
              _tbl text,
              _target_col text, 
              _type_col text, 
              _source_col text, 
              _source_value_col text, 
              target_schema text,
              target_table text
            ) 
  RETURNS TABLE(
                  resultsSchema text,
                  cdmSchema text,
                  table_name text,
                  target_column_name text,
                  type_column_name text,
                  source_column_name text,
                  source_value_column_name text,
                  target_concept_id integer,
                  type_concept_id integer,
                  source_concept_id integer,
                  source_value text,
                  count bigint
                )
  AS
  $func$
  declare sql text;
  BEGIN
    RAISE NOTICE 'getting concept_ids for %', _tbl;
    sql := format(
      'INSERT INTO %s.%s ' ||
      'SELECT ' ||
      '       ''%s'' as schema, ' ||
      '       ''%s'' as table_name, ' ||
      '       ''%s'' as target_column_name, ' ||
      '       ''%s'' as type_column_name, ' ||
      '       ''%s'' as source_column_name, ' ||
      '       ''%s'' as source_value_column_name, ' ||
      '       %s as target_concept_id, ' ||
      '       %s as type_concept_id, ' ||
      '       %s as source_concept_id, ' ||
      '       %s as source_value, ' ||
      '       count(*) as count ' ||
      'from (select * from %s.%s) t ' ||
      --'from (select * from %s.%s limit 5) t ' ||
      --'where %s > 0 ' ||
      'group by 1,2,3,4,5,6,7,8,9,10',
        target_schema, target_table, 
        _schema, 
        _tbl, 

        _target_col, 
        _type_col, 
        _source_col, 
        _source_value_col, 

        _target_col, 
        _type_col, 
        _source_col, 
        _source_value_col, 
        
        _schema, _tbl
      );
    RAISE NOTICE '%', sql;
    EXECUTE sql;
  END;
  $func$ LANGUAGE plpgsql;
  
--select store_concept_id_counts('cdm2','drug_exposure','drug_concept_id','drug_type_concept_id','drug_source_concept_id','drug_source_value','results2','concept_id_occurrence');

select store_concept_id_counts(
          schema::text,
          table_name::text,
          target_col::text,
          type_col::text,
          source_col::text,
          source_value_col::text,
          target_schema::text,
          target_table::text
) from
  (select 'cdm2' as schema,
          table_name,
          target_col,
          type_col,
          source_col,
          source_value_col,
          current_setting('my.vars.results')::text target_schema, 
          'concept_id_occurrence'::text target_table
    from concept_cols_by_table cct) x;



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


/* should be view or materialzed view */  -- OBSOLETE
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

/* more informative and table-specific: */

drop table if exists :results.drug_concept_counts;
create table :results.drug_concept_counts as
  select  drug_concept_id, 
          drug_source_concept_id, 
          drug_source_value, 
          drug_type_concept_id, 
          count(*) as count
  from :cdm.drug_exposure
  group by 1,2,3,4;

create or replace view :results.drug_concept_info as
  select  c.concept_name as concept_name,
          ct.concept_name as type_concept_name,
          c.invalid_reason, 
          c.standard_concept, 
          c.domain_id, 
          c.vocabulary_id, 
          c.concept_class_id,
          dcc.drug_concept_id as concept_id,
          dcc.drug_type_concept_id as type_concept_id,
          sum(dcc.count) as dbrecs,
          count(*) as source_concept_count
  from :results.drug_concept_counts dcc 
  join :cdm.concept c on dcc.drug_concept_id = c.concept_id
  join :cdm.concept ct on dcc.drug_type_concept_id = ct.concept_id and ct.invalid_reason is null
  group by 1,2,3,4,5,6,7,8,9
  ;
create or replace view :results.drug_source_concept_info as
  select  c.concept_name as concept_name,
          dcc.drug_source_value as source_value,
          ct.concept_name as type_concept_name,
          c.invalid_reason, 
          c.standard_concept, 
          c.domain_id, 
          c.vocabulary_id, 
          c.concept_class_id,
          dcc.drug_concept_id as concept_id,
          dcc.drug_type_concept_id as type_concept_id,
          sum(dcc.count) as dbrecs,
          count(*) as target_concept_count
  from :results.drug_concept_counts dcc 
  join :cdm.concept c on dcc.drug_source_concept_id = c.concept_id
  join :cdm.concept ct on dcc.drug_type_concept_id = ct.concept_id and ct.invalid_reason is null
  group by 1,2,3,4,5,6,7,8,9,10
  ;
/*
create or replace view :results.drug_concept_info as
  select  c.concept_name as target_concept_name,
          cs.concept_name as source_concept_name,
          ct.concept_name as type_concept_name,

          c.invalid_reason as target_invalid_reason,
          c.standard_concept as target_standard_concept,
          c.domain_id as target_domain_id,
          c.vocabulary_id as target_vocabulary_id,
          c.concept_class_id as target_concept_class_id,

          cs.invalid_reason as source_invalid_reason,
          cs.standard_concept as source_standard_concept,
          cs.domain_id as source_domain_id,
          cs.vocabulary_id as source_vocabulary_id,
          cs.concept_class_id as source_concept_class_id,

          dcc.drug_concept_id as concept_id,
          dcc.drug_source_concept_id as source_concept_id,
          dcc.drug_source_value as source_value,
          dcc.drug_type_concept_id as type_concept_id,
          dcc.count
  from :results.drug_concept_counts dcc 
  join :cdm.concept c on dcc.drug_concept_id = c.concept_id
  join :cdm.concept cs on dcc.drug_source_concept_id = cs.concept_id and cs.invalid_reason is null
  join :cdm.concept ct on dcc.drug_type_concept_id = ct.concept_id and ct.invalid_reason is null
  ;
*/

drop table if exists :results.drug_concept_info_stats;
/*
create table :results.drug_concept_info_stats as
  select  type_concept_name,
          invalid_reason, 
          standard_concept, 
          domain_id, 
          vocabulary_id, 
          concept_class_id,
          type_concept_id,
          count(*) as conceptrecs,
          sum(count) as dbrecs
  from :results.drug_concept_info
  group by 1,2,3,4,5,6,7
  ; */
create table :results.drug_concept_info_stats as
  select  type_concept_name,

          target_invalid_reason, 
          target_standard_concept, 
          target_domain_id, 
          target_vocabulary_id, 
          target_concept_class_id,

          source_invalid_reason, 
          source_standard_concept, 
          source_domain_id, 
          source_vocabulary_id, 
          source_concept_class_id,

          type_concept_id,
          count(*) as conceptrecs,
          sum(count) as dbrecs
  from :results.drug_concept_info
  group by 1,2,3,4,5,6,7,8,9,10,11,12
  ;


/*
drop table if exists :results.condition_concept_counts;
create table :results.condition_concept_counts as
select condition_concept_id, condition_source_concept_id, condition_source_value, condition_type_concept_id, count(*)
from :cdm.condition_occurrence
group by 1,2,3,4;
*/



/* should be view or materialzed view */
-- based on concept_relationship table only. see class_pedigree for stuff based on ancestor
drop table if exists :results.class_relations_pre;
create table :results.class_relations_pre as
select
        r.relationship_id,
        r.relationship_name,
        r.is_hierarchical,
        r.defines_ancestry,
        rr.is_hierarchical as reverse_is_hierarchical,
        rr.defines_ancestry as reverse_defines_ancestry,
        r.reverse_relationship_id,

        
        cr.concept_id_1,
        c1.domain_id as domain_id_1,
        c1.vocabulary_id as vocab_1,
        c1.concept_class_id as class_1,
        c1.standard_concept as sc_1,
        c1.invalid_reason as invalid_1,

        cr.concept_id_2,
        c2.domain_id as domain_id_2,
        c2.vocabulary_id as vocab_2,
        c2.concept_class_id as class_2,
        c2.standard_concept as sc_2,
        c2.invalid_reason as invalid_2
from :cdm.concept_relationship cr
join :cdm.concept c1 on cr.concept_id_1 = c1.concept_id /* and c1.invalid_reason is null */
join :cdm.concept c2 on cr.concept_id_2 = c2.concept_id /* and c2.invalid_reason is null */
join :cdm.relationship r on cr.relationship_id = r.relationship_id
join :cdm.relationship rr on cr.reverse_relationship_id = rr.relationship_id
where cr.invalid_reason is null
;

create index class_relations_pre_idx on :results.class_relations_pre (
        relationship_id,
        relationship_name,
        is_hierarchical,
        defines_ancestry,
        reverse_relationship_id,
        domain_id_1,
        vocab_1,
        class_1,
        sc_1,
        invalid_1,
        domain_id_2,
        vocab_2,
        class_2,
        sc_2,
        invalid_2);

drop table if exists :results.class_relations cascade;
create table :results.class_relations as
select
        case when vocab_1 = vocab_2 then true else false end as same_vocab,
        case when class_1 = class_2 then true else false end as same_class,

        relationship_id,
        relationship_name,
        is_hierarchical,
        defines_ancestry,
        reverse_relationship_id,
          /*
            thought i should include No Matching Concept indicator since concept_id
            isn't included, but you can get it by testing vocab_1 = 'None'
          */
        domain_id_1,
        vocab_1,
        class_1,
        sc_1,
        invalid_1,

        domain_id_2,
        vocab_2,
        class_2,
        sc_2,
        invalid_2,

        count(distinct concept_id_1) as c1_ids,
        count(distinct concept_id_2) as c2_ids,
        count(*) c
from :results.class_relations_pre cr
group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17
;









drop table if exists :results.class_pedigree_pre;
create table :results.class_pedigree_pre as
select
        'concept_ancestor'::varchar(20) as source,
        min_levels_of_separation,
        ca.ancestor_concept_id,
        c1.domain_id as domain_id_1,
        c1.vocabulary_id as vocab_1,
        c1.concept_class_id as class_1,
        c1.standard_concept as sc_1,
        --c1.invalid_reason as invalid_1,

        ca.descendant_concept_id,
        c2.domain_id as domain_id_2,
        c2.vocabulary_id as vocab_2,
        c2.concept_class_id as class_2,
        c2.standard_concept as sc_2
        --c2.invalid_reason as invalid_2
from :cdm.concept_ancestor ca
join :cdm.concept c1 on ca.ancestor_concept_id = c1.concept_id and c1.invalid_reason is null
join :cdm.concept c2 on ca.descendant_concept_id = c2.concept_id and c2.invalid_reason is null
--where cr.invalid_reason is null
;

insert into :results.class_pedigree_pre
select  
        'concept_relationship' as source,
        0,
        cr.concept_id_1,
        c1.domain_id as domain_id_1,
        c1.vocabulary_id as vocab_1,
        c1.concept_class_id as class_1,
        c1.standard_concept as sc_1,
        cr.concept_id_2,
        c2.domain_id as domain_id_2,
        c2.vocabulary_id as vocab_2,
        c2.concept_class_id as class_2,
        c2.standard_concept as sc_2
from cdm2.concept_relationship cr
join cdm2.relationship r on cr.relationship_id = r.relationship_id
join cdm2.concept c1 on cr.concept_id_1 = c1.concept_id and c1.invalid_reason is null
join cdm2.concept c2 on cr.concept_id_2 = c2.concept_id and c2.invalid_reason is null
where cr.relationship_id = 'Maps to'
  and cr.invalid_reason is null
;

create index class_pedigree_pre_idx on :results.class_pedigree_pre (
        source,
        min_levels_of_separation,
        domain_id_1,
        vocab_1,
        class_1,
        sc_1,
        --invalid_1,
        domain_id_2,
        vocab_2,
        class_2,
        sc_2
        --invalid_2
      );

drop table if exists :results.class_pedigree cascade;
create table :results.class_pedigree as
select
        source,
        min_levels_of_separation,
        domain_id_1,
        vocab_1,
        class_1,
        sc_1,
        --invalid_1,
        domain_id_2,
        vocab_2,
        class_2,
        sc_2,
        --invalid_2,
        count(distinct ancestor_concept_id) as c1_ids,
        count(distinct descendant_concept_id) as c2_ids,
        count(*) c
from :results.class_pedigree_pre cr
group by 1,2,3,4,5,6,7,8,9,10
;























create table results2.concept_rel_missing_direct_ancestor as (
select
        cr.concept_id_1,
        c1.vocabulary_id as vocab1,
        c1.concept_class_id as class1,
        cr.concept_id_2,
        c2.vocabulary_id as vocab2,
        c2.concept_class_id as class2,
        defines_ancestry,
        is_hierarchical,
        min(ca.min_levels_of_separation),
        max(ca.min_levels_of_separation),
        count(ca.min_levels_of_separation)
from concept_relationship cr
join relationship r on cr.relationship_id = r.relationship_id
join concept c1 on cr.concept_id_1 = c1.concept_id
join concept c2 on cr.concept_id_2 = c2.concept_id
left join concept_ancestor ca
  on cr.concept_id_1 = ca.ancestor_concept_id
     and cr.concept_id_2 = ca.descendant_concept_id
    and ca.min_levels_of_separation > 1
where
      cr.invalid_reason is null
  and (r.is_hierarchical = '1' or r.defines_ancestry = '1')
  and c1.invalid_reason is null
  and c2.invalid_reason is null
  and c1.standard_concept is not null
  and c2.standard_concept is not null
group by 1,2,3,4,5,6,7,8
having min(ca.min_levels_of_separation) > 1
);

select
        vocab1,
        class1,
        vocab2,
        class2,
        defines_ancestry,
        is_hierarchical,
        min(min) min_levels_of_separation,
        sum(count) relationships
from results2.concept_rel_missing_direct_ancestor
/*where vocab1 not in ('DPD') and vocab2 not in ('DPD') */
group by 1,2,3,4,5,6
order by 1,2,3,4,5,6
;

create table results2.ancestor_missing_concept_rel as (
select
        ca.ancestor_concept_id,
        c1.vocabulary_id as vocab1,
        c1.concept_class_id as class1,
        ca.descendant_concept_id,
        c2.vocabulary_id as vocab2,
        c2.concept_class_id as class2,
        count(ca.min_levels_of_separation)
from concept_ancestor ca
join concept c1 on ca.ancestor_concept_id = c1.concept_id
join concept c2 on ca.descendant_concept_id = c2.concept_id
left join concept_relationship cr
  on cr.concept_id_1 = ca.ancestor_concept_id
     and cr.concept_id_2 = ca.descendant_concept_id
where
      ca.min_levels_of_separation = 1
  and cr.concept_id_1 is null
  and c1.invalid_reason is null
  and c2.invalid_reason is null
  and c1.standard_concept is not null
  and c2.standard_concept is not null
group by 1,2,3,4,5,6
) ;

select
        vocab1,
        class1,
        vocab2,
        class2,
        defines_ancestry,
        is_hierarchical,
        min(min) min_levels_of_separation,
        sum(count) relationships
from results2.concept_rel_missing_direct_ancestor
/*where vocab1 not in ('DPD') and vocab2 not in ('DPD') */
group by 1,2,3,4,5,6
order by 1,2,3,4,5,6
;


/* relationships without reciprocals */
with allrel as (
  select r.relationship_id, r.reverse_relationship_id,
          row_number() over (order by r.relationship_id) rnum,
          row_number() over (order by r.reverse_relationship_id) rrnum
  from :cdm.relationship r
)
select *
from allrel
where rnum < rrnum or relationship_id < reverse_relationship_id
order by 3,4;

/* concept relationships without reciprocals 
no good
maybe come back to this later
with allrel as (
  select r.concept_id_1, r.concept_id_2,
          row_number() over (order by r.concept_id_1) rnum1,
          row_number() over (order by r.concept_id_2) rnum2
  from :cdm.concept_relationship r
)
select *
from allrel
where rnum1 < rnum2
order by 3,4;
*/


/* didn't work
with recursive rel as (
  select r.concept_id_1, r.concept_id_2,
          array[r.concept_id_1] as path_info,
          (r.concept_id_1 = r.concept_id_2) as cycle
  from concept_relationship r
  left join concept_relationship r2
        on r.concept_id_2 = r2.concept_id_1
        and r2.concept_id_1 < r2.concept_id_2
  where
        r.concept_id_1 < r.concept_id_2
    and r.invalid_reason is null
    and r2.concept_id_1 is null
  union all
  select cr.concept_id_1, cr.concept_id_2, rel.path_info || cr.concept_id_1,
          cr.concept_id_2 = any(rel.path_info)
  from rel
  join concept_relationship cr on cr.concept_id_1 = rel.concept_id_2
  where not rel.cycle
)
select *
from rel
where cycle ;
*/

create or replace view :cdm.concept_relationship_one_way as 
    select distinct r.concept_id_1 as concept_id
      from :cdm.concept_relationship r
      left join :cdm.concept_relationship r2
            on r.concept_id_2 = r2.concept_id_1
            and r2.concept_id_1 < r2.concept_id_2
      where
            r.concept_id_1 < r.concept_id_2
        and r.invalid_reason is null
        and r2.concept_id_1 is null;

create table results2.start_concepts as (
  with sc as (
    select distinct r.concept_id_1 as concept_id
      from concept_relationship r
      left join concept_relationship r2
            on r.concept_id_2 = r2.concept_id_1
            and r2.concept_id_1 < r2.concept_id_2
      where
            r.concept_id_1 < r.concept_id_2
        and r.invalid_reason is null
        and r2.concept_id_1 is null

    union

    select distinct ca.ancestor_concept_id
      from concept_ancestor ca
      left join concept_ancestor ca2
            on ca2.ancestor_concept_id = ca.descendant_concept_id
            and ca2.ancestor_concept_id < ca2.descendant_concept_id
      where
            ca.ancestor_concept_id < ca.descendant_concept_id
  )
  select distinct sc.concept_id
  from sc
  join concept c on sc.concept_id = c.concept_id
  where c.invalid_reason is null
);

CREATE OR REPLACE 
  FUNCTION :results.concept_link_path(path_so_far integer[], dpth integer)
  RETURNS TABLE(new_path integer[])
  AS
  $func$
  declare link_concepts integer[];
  declare last_id integer;
  BEGIN
    if array_length(path_so_far, 1) > 5 then
      --raise notice 'depth: %, should be returning link concepts: %, path so far: %: %', dpth, array_length(link_concepts,1), array_length(path_so_far,1), path_so_far;
      return query
                select path_so_far;
    else
      --raise notice 'depth: %, should not be returning link concepts: %, path so far: %: %', dpth, array_length(link_concepts,1), array_length(path_so_far,1), path_so_far;
      --raise notice 'depth: %, did not return link concepts: %, path so far: %: %', dpth, array_length(link_concepts,1), array_length(path_so_far,1), path_so_far;
      last_id = path_so_far[array_length(path_so_far,1)];
      select distinct array_agg(concept_id_2) into link_concepts
        from (
          select distinct concept_id_2
          from cdm2.concept_relationship cr
          join cdm2.relationship r on cr.relationship_id = r.relationship_id
          join cdm2.concept c1 on cr.concept_id_1 = c1.concept_id and c1.vocabulary_id != 'DPD' and c1.invalid_reason is null
          join cdm2.concept c2 on cr.concept_id_2 = c2.concept_id and c2.vocabulary_id != 'DPD' and c2.invalid_reason is null
          where concept_id_1 = last_id
            and concept_id_2 != all(path_so_far)
            and cr.invalid_reason is null
            and (is_hierarchical = '1' or defines_ancestry = '1')
        ) x;
      raise notice 'depth: %, link concepts: %:%s, path so far: %: %', dpth, array_length(link_concepts,1), link_concepts, array_length(path_so_far,1), path_so_far;
      /*raise notice 'path so far:    %', path_so_far;*/
      if array_length(link_concepts, 1) > 0 and array_length(path_so_far,1) < 5 then
        return query
                  /*select array_append(path_so_far,id)*/
                  select concept_link_path(array_append(path_so_far,id), dpth + 1)
                  from ( select unnest(link_concepts[1:4]) as id ) x;
      else
        return query
                  select path_so_far;
      end if;
    end if;
  END
  $func$ LANGUAGE plpgsql;

CREATE OR REPLACE /* concept_ancestor version... if it works */
  FUNCTION :results.concept_link_path(path_so_far integer[], dpth integer)
  RETURNS TABLE(new_path integer[])
  AS
  $func$
  declare link_concepts integer[];
  declare last_id integer;
  BEGIN
    if array_length(path_so_far, 1) > 5 then
      --raise notice 'depth: %, should be returning link concepts: %, path so far: %: %', dpth, array_length(link_concepts,1), array_length(path_so_far,1), path_so_far;
      return query
                select path_so_far;
    else
      --raise notice 'depth: %, should not be returning link concepts: %, path so far: %: %', dpth, array_length(link_concepts,1), array_length(path_so_far,1), path_so_far;
      --raise notice 'depth: %, did not return link concepts: %, path so far: %: %', dpth, array_length(link_concepts,1), array_length(path_so_far,1), path_so_far;
      last_id = path_so_far[array_length(path_so_far,1)];
      select distinct array_agg(descendant_concept_id) into link_concepts
        from (
          select distinct descendant_concept_id
          from cdm2.concept_ancestor cr
          join cdm2.concept c1 on cr.ancestor_concept_id = c1.concept_id and c1.vocabulary_id != 'DPD' and c1.invalid_reason is null
          join cdm2.concept c2 on cr.descendant_concept_id = c2.concept_id and c2.vocabulary_id != 'DPD' and c2.invalid_reason is null
          where ancestor_concept_id = last_id
            and descendant_concept_id != all(path_so_far)
            /* and cr.invalid_reason is null */
            and min_levels_of_separation = 1
        ) x;
      raise notice 'depth: %, link concepts: %:%s, path so far: %: %', dpth, array_length(link_concepts,1), link_concepts, array_length(path_so_far,1), path_so_far;
      /*raise notice 'path so far:    %', path_so_far;*/
      if array_length(link_concepts, 1) > 0 and array_length(path_so_far,1) < 5 then
        return query
                  /*select array_append(path_so_far,id)*/
                  select concept_link_path(array_append(path_so_far,id), dpth + 1)
                  from ( select unnest(link_concepts[1:4]) as id ) x;
      else
        return query
                  select path_so_far;
      end if;
    end if;
  END
  $func$ LANGUAGE plpgsql;

select * from concept_link_path(array[36312420], 1);

with names as (
  with unnestids as (
    select new_path, unnest(new_path) id, generate_subscripts(new_path, 1) AS i
    from concept_link_path(array[4333507], 1)
  )
  select new_path, i, id, c.vocabulary_id, c.concept_class_id, c.concept_name
  from unnestids
  join cdm2.concept c on id = c.concept_id
  order by 1,2
)
--select new_path, array_agg(vocabulary_id||':'||concept_name), array_agg(id)
--select new_path, array_agg(vocabulary_id||':'||concept_class_id), array_agg(id)
select array_agg(vocabulary_id||':'||concept_class_id||':'||concept_name), new_path
from names
group by new_path
order by 1
--having array_agg(id) = new_path


CREATE OR REPLACE 
  FUNCTION junk(x integer)
  RETURNS TABLE(
                  x integer
                )
  AS
  $func$
    select 3
  $func$ LANGUAGE sql;
  

/* Christian's query for selecting single-hop links only from concept_ancestor

with real_ancestor as (
  select ancestor_concept_id, descendant_concept_id
  from cdm2.concept_ancestor
  where ancestor_concept_id!=descendant_concept_id
)
select * from real_ancestor
except
select a.ancestor_concept_id, b.descendant_concept_id
from real_ancestor a
join real_ancestor b on a.descendant_concept_id=b.ancestor_concept_id
*/



/* where r.is_hierarchical = '1' and c1.vocabulary_id = c2.vocabulary_id */
/*having count(distinct c1.concept_id) <= count(distinct c2.concept_id) and count(distinct c2.concept_id) >  count(distinct c1.concept_id) */

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
