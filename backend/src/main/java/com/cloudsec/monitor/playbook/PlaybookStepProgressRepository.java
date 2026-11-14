
package com.cloudsec.monitor.playbook;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlaybookStepProgressRepository
        extends JpaRepository<PlaybookStepProgress, Long> {

    List<PlaybookStepProgress> findByExecutionId(Long executionId);
}
