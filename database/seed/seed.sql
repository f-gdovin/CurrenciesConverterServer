BEGIN TRANSACTION;

INSERT INTO usage (total_amount_converted, total_requests_made) VALUES (0.0, 0);

INSERT INTO rank (currency_code, total_times_used) VALUES ('CZK', 100);

COMMIT;