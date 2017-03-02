
-- change these settings to the appropriate cdm and results schemas
--   right now not all queries have table names qualified by schema, that
--   needs to be fixed
\set cdm cdm2
set session my.vars.cdm = :cdm; -- lets me use it as string in query (as per http://stackoverflow.com/a/29469454/1368860)
\set results results2
set session my.vars.results = :results;

-- will probably have to put invalid concepts back in? people will get confused possibly if they're not there

--\i cols-and-counts.sql

--\i ancestor-creates.sql

--\i descendants-based-on-ancestorsplus.sql


\i descendants-based-on-concept_relationship.sql


