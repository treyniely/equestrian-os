CREATE TRIGGER horse_workload_guard BEFORE INSERT ON reservations WHEN NEW.kind='horse' BEGIN
 SELECT RAISE(ABORT,'horse_daily_limit') WHERE
 (SELECT json_extract(details,'$.dailyLimitMinutes') FROM resources WHERE id=NEW.resource AND tenant=NEW.tenant AND kind='horse') IS NOT NULL AND
 ((SELECT (end-start)/60000 FROM sessions WHERE id=NEW.session AND tenant=NEW.tenant)+
 COALESCE((SELECT SUM((s.end-s.start)/60000) FROM reservations r JOIN sessions s ON s.id=r.session AND s.tenant=r.tenant JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant WHERE r.tenant=NEW.tenant AND r.resource=NEW.resource AND r.kind='horse' AND s.status='scheduled' AND date(s.start/1000,'unixepoch')=date(current.start/1000,'unixepoch')),0)+
 COALESCE((SELECT SUM((b.end-b.start)/60000) FROM bookings b JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant WHERE b.tenant=NEW.tenant AND b.horse=NEW.resource AND b.status<>'canceled' AND date(b.start/1000,'unixepoch')=date(current.start/1000,'unixepoch')),0))>
 (SELECT json_extract(details,'$.dailyLimitMinutes') FROM resources WHERE id=NEW.resource AND tenant=NEW.tenant AND kind='horse');
 SELECT RAISE(ABORT,'horse_rest') WHERE EXISTS(
 SELECT 1 FROM reservations r JOIN sessions old ON old.id=r.session AND old.tenant=r.tenant JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant JOIN resources horse ON horse.id=NEW.resource AND horse.tenant=NEW.tenant WHERE r.tenant=NEW.tenant AND r.resource=NEW.resource AND old.status='scheduled' AND current.start<old.end+COALESCE(json_extract(horse.details,'$.restMinutes'),0)*60000 AND old.start<current.end+COALESCE(json_extract(horse.details,'$.restMinutes'),0)*60000);
 SELECT RAISE(ABORT,'horse_rest') WHERE EXISTS(
 SELECT 1 FROM bookings old JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant JOIN resources horse ON horse.id=NEW.resource AND horse.tenant=NEW.tenant WHERE old.tenant=NEW.tenant AND old.horse=NEW.resource AND old.status<>'canceled' AND current.start<old.end+COALESCE(json_extract(horse.details,'$.restMinutes'),0)*60000 AND old.start<current.end+COALESCE(json_extract(horse.details,'$.restMinutes'),0)*60000);
END;
