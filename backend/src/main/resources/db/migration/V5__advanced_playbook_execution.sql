ALTER TABLE playbook_executions
ADD COLUMN execution_status VARCHAR(30) NOT NULL DEFAULT 'RUNNING';

ALTER TABLE playbook_executions
ADD COLUMN started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE playbook_executions
ADD COLUMN completed_at TIMESTAMP;

CREATE INDEX idx_playbook_execution_status
ON playbook_executions(execution_status);
