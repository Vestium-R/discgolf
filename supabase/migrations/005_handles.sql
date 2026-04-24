-- Backfill UDisc handles for existing rows.
update players set udisc_handle = 'jeffreyr' where id = 'jeffrey-rijkse' and udisc_handle is null;
update players set udisc_handle = 'battletroll741' where id = 'mathieu-jacob' and (udisc_handle is null or udisc_handle <> 'battletroll741');
update players set udisc_handle = 'reginald151' where id = 'reginald-roth' and udisc_handle is null;
update players set udisc_handle = 'bboggin' where id = 'scott-brohm' and (udisc_handle is null or udisc_handle <> 'bboggin');
