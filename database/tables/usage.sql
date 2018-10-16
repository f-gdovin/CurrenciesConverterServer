BEGIN TRANSACTION;

CREATE TABLE usage (
  total_amount_converted DOUBLE PRECISION DEFAULT 0,
  total_requests_made BIGINT DEFAULT 0
);

COMMIT;