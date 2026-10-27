
package com.cloudsec.monitor.playbook;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playbooks")
public class PlaybookController {

    private final PlaybookService playbookService;

    public PlaybookController(PlaybookService playbookService) {
        this.playbookService = playbookService;
    }

    @GetMapping("/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public List<PlaybookStep> getPlaybook(
            @PathVariable String category) {

        return playbookService.getPlaybook(category);
    }
}
