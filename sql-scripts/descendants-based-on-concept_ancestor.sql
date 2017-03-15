

/* cg_dcids
    for every concept group (which includes different grouping levels)
    collect all the descendant concept ids connected to the concepts in
    that group. if we didn't go through all the steps we did to get here,-
    there would be no way to be sure we only counted the descendant concept
    ids in each concept group only once.

    it would be better to include source but it takes so long to run, I've given
    up on that.
*/
drop table if exists :results.cg_dcids;
create table :results.cg_dcids as
    select  cgwc.cgid,
            :results.array_unique(
                    array_agg(ca.descendant_concept_id order by descendant_concept_id)
                  ) dcids
    from :results.concept_groups_w_cids cgwc
    left join :cdm.concept_ancestor ca on ca.ancestor_concept_id = any(cgwc.cids)
    where grpset != array[]::text[]
    group by 1; --,2;

/*
    cg_dcids (above) has one row for each concept group with an array of its
    descendant concept ids -- 1951 rows. But there are only 275 distinct arrays
    of descendant concept ids, so I'm giving them their own smaller table with
    one row per distinct descendant id set and a list of all the concept group
    ids having that descendant group for its descendants
*/
drop table if exists :results.dcid_groups;
create table :results.dcid_groups as
  select  row_number() over () as dcid_grp_id,
          array_agg(cgid) cgids,
          dcids
  from :results.cg_dcids group by dcids;

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
drop table if exists :results.dcid_cnts;
create table :results.dcid_cnts as
  select  dcid_grp_id, cgids, 
          count(rc.concept_id) dcc,
          count(distinct rc.tbl||rc.col) dtblcols,
          sum(rc.rc) drc,
          sum(rc.src) dsrc
  from :results.dcid_groups dg
  left join record_counts rc on rc.concept_id = any(dg.dcids)
  group by 1,2;

  
/* concept_groups
    this is the main counts table. it brings together what we already know
    about concept groups with descendant counts. as mentioned above, these
    descendant counts can be misleading, but they'll do for a first pass
*/
drop table if exists :results.concept_groups cascade;
create table :results.concept_groups as
  select  cgw.cgid, cgw.grp, cgw.grpset, cgw.vals, 
          cgw.cc, cgw.tblcols, cgw.rc, cgw.src, 
          dg.dcid_grp_id,
          dg.dcc,
          dg.dtblcols,
          dg.drc,
          dg.dsrc
  from :results.concept_groups_w_cids cgw
  join dcid_cnts dg on cgw.cgid = any(dg.cgids);



/* dcid_cnts_breakdown
    now we get descendant record counts broken down by the same groupings
    as we used for concept groups. i don't know if these will all be useful,
    but it gives us access to more meaningful descendant counts than the
    concept_groups table. at least the {tbl,col,coltype} groupings will
    be important, but I think others will be as well, if we can make a
    reasonable ui for navigating them.
*/
drop table if exists :results.dcid_cnts_breakdown cascade;
create table :results.dcid_cnts_breakdown (
  dcid_grp_id integer,
  cgids integer[],
  grp integer,
  grpset text[],
  vals text[],
  dcc bigint,
  dtblcols bigint,
  drc bigint,
  dsrc bigint,
  dcids integer[]
);

CREATE OR REPLACE FUNCTION :results.make_dcid_cnts_breakdown() returns integer AS $func$
  declare dcid_group record;
  BEGIN
    for dcid_group in select * from :results.dcid_groups loop
      RAISE NOTICE 'dcid_group %: % cids, % dcids', 
        dcid_group.dcid_grp_id, 
        array_length(dcid_group.dcids,1),
        array_length(dcid_group.cgids,1);
        insert into dcid_cnts_breakdown
          select  dcid_group.dcid_grp_id, dcid_group.cgids,
                  x.grp, x.grpset, 
                  array(select row_to_json(x.*)->>unnest(x.grpset) col) vals,
                  cc dcc, tblcols dtblcols, rc drc, src dsrc, cids dcids
          from (
            select    distinct
                      domain_id,
                      standard_concept,
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
                      count(distinct concept_id)::integer cc,
                      count(distinct tbl||col)::integer tblcols,
                      sum(rc) rc,
                      sum(src) src,
                      :results.array_unique(
                              array_agg(rc.concept_id order by concept_id)
                            ) cids
            from :results.record_counts rc
            --where cardinality($1) = 0 or rc.concept_id = any($1)
            where rc.concept_id = any(dcid_group.dcids)
            group by  grouping sets 
                        (rollup(
                                domain_id, standard_concept, vocabulary_id, concept_class_id, 
                                (tbl, col, coltype)
                              ),
                        (tbl,col,coltype),
                        (domain_id, standard_concept, vocabulary_id, tbl,col,coltype)
                      )
                    ) x;
    end loop;
    return 1;
  END;
  $func$ LANGUAGE plpgsql;

select * from :results.make_dcid_cnts_breakdown();

