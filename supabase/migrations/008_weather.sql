-- Optional round conditions: temperature (°F) and wind (mph).
-- Nullable — older rounds won't have data.

alter table rounds add column if not exists temperature_f int;
alter table rounds add column if not exists wind_mph int;
