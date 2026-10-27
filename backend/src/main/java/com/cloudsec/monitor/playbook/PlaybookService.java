
package com.cloudsec.monitor.playbook;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaybookService {

    public List<PlaybookStep> getPlaybook(String category) {

        if (category == null) {
            category = "";
        }

        switch (category.toUpperCase()) {

            case "AUTH_ATTACK":
                return List.of(
                    new PlaybookStep(
                        "Review authentication logs",
                        "Examine failed login attempts and identify suspicious IP addresses."
                    ),
                    new PlaybookStep(
                        "Verify the affected account",
                        "Check whether the login activity is expected or suspicious."
                    ),
                    new PlaybookStep(
                        "Notify the security analyst",
                        "Report the suspicious login activity to the security team."
                    )
                );

            case "NETWORK_INTRUSION":
                return List.of(
                    new PlaybookStep(
                        "Review network activity",
                        "Inspect the incident's network events and destination addresses."
                    ),
                    new PlaybookStep(
                        "Assess the affected asset",
                        "Determine which system may be involved and assess the risk."
                    ),
                    new PlaybookStep(
                        "Notify the security analyst",
                        "Share the findings with the responsible security team."
                    )
                );

            default:
                return List.of(
                    new PlaybookStep(
                        "Investigate the incident",
                        "Review the incident description, category, and available evidence."
                    ),
                    new PlaybookStep(
                        "Document findings",
                        "Record the investigation results and notify the responsible analyst."
                    )
                );
        }
    }
}
