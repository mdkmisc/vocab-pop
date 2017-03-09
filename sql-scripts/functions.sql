CREATE OR REPLACE FUNCTION :results.array_unique(arr anyarray)
 RETURNS anyarray
 LANGUAGE sql
AS $function$
    select array_remove(array( select distinct unnest($1) order by 1 ),null)
$function$;

DROP AGGREGATE :results.array_cat_agg(anyarray);
CREATE AGGREGATE :results.array_cat_agg(anyarray) (
  SFUNC=array_cat,
  STYPE=anyarray
);

create or replace function :results.dsql(_t regclass, _c text, _cid int, _limit int default null)
returns setof json as
$func$
declare sql varchar;
        lim varchar;
begin
  if _limit > 0 then
    lim := ' limit ' || _limit;
  else
    lim := '';
  end if;
  RETURN QUERY EXECUTE format('
      SELECT row_to_json(x) FROM
        (SELECT * FROM %s
          WHERE  %s = $1
          %s
        ) x'
    , _t, quote_ident(_c), lim)
   USING  _cid;
end;
$func$
LANGUAGE 'plpgsql';
