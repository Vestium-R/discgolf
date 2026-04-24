-- Store temperature in Celsius (primary). Keep °F column for data preservation.
-- Also: variants no longer force counts=false — all rounds count by default;
-- admins can still untick "counts" manually on a round they want in history only.

alter table rounds add column if not exists temperature_c numeric(5,1);

update rounds
set temperature_c = round(((temperature_f - 32) * 5.0 / 9.0)::numeric, 1)
where temperature_f is not null and temperature_c is null;

-- Ensure all existing rounds count (in case migration 007 set some to false).
update rounds set counts = true where counts is distinct from true;
