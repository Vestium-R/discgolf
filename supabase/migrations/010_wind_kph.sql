-- Metric-only: store wind as km/h. Backfill from wind_mph if present.

alter table rounds add column if not exists wind_kph numeric(5,1);

update rounds
set wind_kph = round((wind_mph * 1.60934)::numeric, 1)
where wind_mph is not null and wind_kph is null;
